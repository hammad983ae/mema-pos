import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  generates: {
    "./src/graphql/__generatedTypes__.ts": {
      overwrite: true,
      schema: "http://localhost:3000/graphql",
      plugins: ["typescript"],
    },
  },
};

export default config;
