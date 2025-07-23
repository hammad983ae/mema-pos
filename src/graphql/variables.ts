import { makeVar } from '@apollo/client';
import { User } from './__generatedTypes__';
import { UploadFile } from 'antd/es/upload/interface';
import {
  AdvocateValues,
  AmbassadorValues,
  GuardianValues,
  ProfileValues,
  StorytellerValues,
} from '../pages';

export const LoggedInUser = makeVar<User | undefined>(undefined);
export const BuildProfile = makeVar<
  ProfileValues & {
    picture?: UploadFile | string;
    banner?: UploadFile | string;
    dob?: any;
    storyteller?: StorytellerValues & { images?: UploadFile[] | string[] };
    advocate?: AdvocateValues;
    guardian?: GuardianValues;
    ambassador?: AmbassadorValues;
  }
>({});
export const ProfileToEdit = makeVar<
  ProfileValues & {
    picture?: UploadFile | string;
    banner?: UploadFile | string;
    dob?: any;
    storyteller?: StorytellerValues & { images?: UploadFile[] | string[] };
    advocate?: AdvocateValues;
    guardian?: GuardianValues;
    ambassador?: AmbassadorValues;
  }
>({});
export const PicturePreview = makeVar<any>(null);
export const BannerPreview = makeVar<any>(null);
export const KeepOldImages = makeVar<boolean>(true);
export const VideoUrls = makeVar<string[]>([]);
export const ProfileUser = makeVar<User | undefined>(undefined);
export const ShareProfile = makeVar<boolean>(false);
export const AuthToken = makeVar<string>('');
