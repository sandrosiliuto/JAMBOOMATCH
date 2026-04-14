export interface UserProfile {
  uid: string;
  name: string;
  photoUrl: string;
  instagram: string;
  createdAt: any;
}

export interface Like {
  fromUid: string;
  toUid: string;
  createdAt: any;
}

export interface Match {
  user: UserProfile;
  timestamp: any;
}
