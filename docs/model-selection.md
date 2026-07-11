---
sidebar_position: 6
title: "Choosing a Model"
---

# Choosing a Model

Open Harness currently consults [DeepSWE](https://deepswe.datacurve.ai/) as its public resource for gauging newly released coding models and informing the best model fit for a task. DeepSWE is an independent benchmark of frontier coding agents on original, long-horizon software-engineering tasks; Open Harness does not own or run it. Its public methodology and data are available in the [DeepSWE source repository](https://github.com/datacurve-ai/deep-swe).

Treat DeepSWE as evidence, not an automatic model picker. Compare long-horizon SWE results together with cost, output-token, and agent-step context. A leaderboard rank alone does not determine the best model for your task.

## Task-fit process

1. **Define the task.** Note its scope, risk, required tools, context size, and depth of reasoning.
2. **Read the benchmark in context.** Compare long-horizon results and the cost, output-token, and agent-step tradeoffs—not rank alone.
3. **Filter for your environment.** Check provider availability, budget and latency, tool compatibility, and context/reasoning needs.
4. **Run a local trial.** Test the strongest candidates on a representative task, then choose the model that delivers the best practical fit.

Recheck DeepSWE when evaluating a newly released model, because benchmark results and available models change over time.
