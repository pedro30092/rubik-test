Whats pnpm?

https://www.reddit.com/r/javascript/comments/1l9jm5k/askjs_pnpm_and_npm_difference/
    Here some its mentioned that pnpm handles faster the dependencies because it centralized the packages, works like a cache mechanism. Between versions, pnpm stores the shared files + different files from the different versions instead of the 2 sets of files.
    
    Also it says that npm has supported "linked mode" which is basically the same as pnpm for over 2 years (https://docs.npmjs.com/cli/v9/commands/npm-install#install-strategy).

https://www.youtube.com/watch?v=mZxAv0bpMWI
    Short explanation about why to use pnpm for development. For my specific case it seems it would be good because of the monorepo Im trying to architects

Conclusion: Is a best practice to use it on my case because Im working in several apps on the same host. So, is great that this tool will help me to save disk storage and for this project that will be use as monorepo.

Docs: https://pnpm.io/motivation