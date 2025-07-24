import { makeVar } from "@apollo/client";
import { Business, User, UserBusinessMembership } from "./__generatedTypes__";

export const AuthToken = makeVar<string | null>(null);
export const LoggedInUser = makeVar<User | undefined>(undefined);
export const UserBusiness = makeVar<Business | undefined>(undefined);
export const UserMembership = makeVar<UserBusinessMembership | undefined>(
  undefined,
);
