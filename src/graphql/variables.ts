import { makeVar } from "@apollo/client";
import { Business, User } from "./__generatedTypes__";

export const AuthToken = makeVar<string | null>(null);
export const LoggedInUser = makeVar<User | undefined>(undefined);
export const UserBusiness = makeVar<Business | undefined>(undefined);
