# rubik-test
App to learn rubik-test by practicing patterns

# General Information

Initial architecture design:
- Angular SPA application
- AWS for Backend (API Gateway + Lambdas + Resources)
- Terraform and CDKTF IaC

The main idea is to load information from https://myrubik.com and create different a "custom" patterns for real life practice. For me, the practice for this kind of activities comes along with muscular activity.

# Copilot/Claude

This project will use AI Chat Agents as helper for development with best practices and "free tier". One of the main goals is to constantly learning/testing the knowledge studied.

Im not going to Agile/Scrum practices and not tools such as spec it. The reason is to avoid wasting token on constantly creating unnecessary information redundant and unpractical.

# App Structure
- src
    - infrastructure: CDKTF files to handles AWS resources management
    - frontend: Angular application
    - backend: AWS lambdas using TS
- docs: Each relevant researching convert to DOCS (MDs) to enhance learning