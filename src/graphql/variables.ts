import { makeVar } from "@apollo/client";
import { Business, StoreDaySession, User } from "./__generatedTypes__";

export const AuthToken = makeVar<string | null>(null);
export const LoggedInUser = makeVar<User | undefined>(undefined);
export const UserBusiness = makeVar<Business | undefined>(undefined);
export const PosSession = makeVar<StoreDaySession | undefined>(undefined);
