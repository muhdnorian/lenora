# Coordinator Memory — lenora swarm

## CORE OPERATING PRINCIPLES (operator directives — ALWAYS follow)
1. NO AGENT SITS IDLE. Every agent actively participates; a worker is either working
   or RELEASED — never parked.
2. COORDINATOR ALWAYS MONITORS the swarm + tracker AUTONOMOUSLY on a cadence —
   do NOT wait for instruction.
3. FIND BOTTLENECKS & SCALE. If one role is a bottleneck (e.g. Fixer backlog),
   SPAWN MORE of that role so each picks issues in parallel.
4. AGENTS WORK THROUGH GITHUB (muhdnorian/lenora): CREATE an issue per finding,
   PICK open issues to solve (claim with `in-progress`), open PRs referencing+closing.
   Coordinator watches via the board.
5. EACH AGENT HAS A SCRATCHPAD (.coordination/scratchpads/<role>.md): read at start,
   append recurring learnings before worker_done.
6. MERGE DUTY DELEGATED to a LEAD DEVELOPER / INTEGRATOR agent ("lead"). It reviews
   + merges green PRs into main, resolves cross-branch conflicts, powers issue closure.
   Coordinator does NOT hand-merge; it just MONITORS and directs.

## ROLES
- tester / feature-rev / critic / fixer (scaleable) / lead (merger) /
  doc / balance / perf / testinfra
