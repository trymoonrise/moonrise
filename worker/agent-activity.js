"use strict";

const { writeWorkspaceFile } = require("../agent/src/workspace");

const FILE_PACE_MS = 140;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clip(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max || 180);
}

function ensureAgent(jobPrompt) {
  if (!jobPrompt.agent || typeof jobPrompt.agent !== "object") {
    jobPrompt.agent = { thoughts: [], files: [] };
  }
  if (!Array.isArray(jobPrompt.agent.thoughts)) jobPrompt.agent.thoughts = [];
  if (!Array.isArray(jobPrompt.agent.files)) jobPrompt.agent.files = [];
  return jobPrompt.agent;
}

function createAgentActivity({ supabase, jobId, jobPrompt, workspaceDir }) {
  let chain = Promise.resolve();

  function enqueue(task) {
    chain = chain.then(task, task);
    return chain;
  }

  async function persist() {
    if (!supabase || !jobId || !jobPrompt) return;
    const { error } = await supabase
      .from("generation_jobs")
      .update({
        prompt: jobPrompt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    if (error) console.warn("agent activity", error.message);
  }

  return {
    thought(text) {
      const line = clip(text);
      if (!line) return Promise.resolve();
      return enqueue(async () => {
        const agent = ensureAgent(jobPrompt);
        agent.thoughts.push({ text: line, at: Date.now() });
        if (agent.thoughts.length > 32) {
          agent.thoughts.splice(0, agent.thoughts.length - 32);
        }
        await persist();
      });
    },

    async writeFiles(files) {
      const list = Array.isArray(files) ? files : [];
      for (const file of list) {
        let bytes = 0;
        const pathName = clip(String(file?.path || "").replace(/\\/g, "/"), 160);
        try {
          if (workspaceDir && pathName) {
            bytes = writeWorkspaceFile(workspaceDir, pathName, file.contents);
          }
        } catch (err) {
          console.warn("agent file", pathName, err.message);
          continue;
        }
        if (!pathName) continue;
        const line = clip(file?.thought);
        await enqueue(async () => {
          const agent = ensureAgent(jobPrompt);
          if (line) {
            agent.thoughts.push({ text: line, at: Date.now() });
            if (agent.thoughts.length > 32) {
              agent.thoughts.splice(0, agent.thoughts.length - 32);
            }
          }
          const prev = agent.files.find((item) => item.path === pathName);
          if (prev) {
            prev.bytes = bytes;
            prev.at = Date.now();
          } else {
            agent.files.push({ path: pathName, bytes, at: Date.now() });
          }
          if (agent.files.length > 40) agent.files.splice(0, agent.files.length - 40);
          await persist();
        });
        await sleep(FILE_PACE_MS);
      }
    },

    savePage(html, thought) {
      return this.writeFiles([
        {
          path: "index.html",
          contents: String(html || ""),
          thought: thought || "",
        },
      ]);
    },
  };
}

module.exports = {
  createAgentActivity,
};
