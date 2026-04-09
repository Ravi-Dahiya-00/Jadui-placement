# Module Mapping

Use this file to place imported code into the correct destination.

## Core Modules

1. Resume Intelligence Engine
- Destination: `backend/app/services/modules/resume_intelligence/`
- Expected scope: parsing, extraction, normalization

2. Skill Gap Analysis Engine
- Destination: `backend/app/services/modules/skill_gap_analysis/`
- Expected scope: role benchmark mapping, gap scoring

3. Agentic Decision Engine
- Destination: `backend/app/services/modules/agentic_decision_engine/`
- Expected scope: LangGraph state, decision loop, orchestration

4. Task Planning & Execution System
- Destination: `backend/app/services/modules/task_planning_execution/`
- Expected scope: daily/weekly planning, task assignment/tracking

5. Conversational AI Mentor
- Destination: `backend/app/services/modules/conversational_mentor/`
- Expected scope: context chat, memory-aware guidance

6. Mock Interview Engine
- Destination: `backend/app/services/modules/mock_interview_engine/`
- Expected scope: question generation, response evaluation, feedback

7. Progress Intelligence Dashboard
- Destination: `backend/app/services/modules/progress_dashboard/`
- Expected scope: metrics aggregation for readiness and trends

8. Alert & Intervention System
- Destination: `backend/app/services/modules/alert_intervention/`
- Expected scope: inactivity/performance triggers and nudges

## API Integration Targets
- Module routes: `backend/app/api/`
- Shared data contracts: `shared/schemas/`
