import { makeVar } from "@apollo/client";
import { User } from "./__generatedTypes__";

export const LoggedInUser = makeVar<User | undefined>(undefined);
export const AuthToken = makeVar<string | null>(null);
