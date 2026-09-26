export type Category = {
  id: string;
  name: string;
  description: string | null;
  status: 'active' | 'inactive';
  sort_order: number;
};

export type Contestant = {
  id: string;
  category_id: string;
  name: string;
  contestant_number: string;
  description: string | null;
  image_url: string | null;
  status: 'active' | 'inactive';
};

export type VotingCodeStatus = 'active' | 'partially_used' | 'used' | 'expired' | 'disabled';

export type VotingCode = {
  id: string;
  code: string;
  amount: number;
  total_points: number;
  used_points: number;
  remaining_points: number;
  status: VotingCodeStatus;
  created_at: string;
};

export type AwardSettings = {
  award_name: string;
  description: string;
  logo_url: string | null;
  price_per_point: number;
  whatsapp_number: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  voting_status: 'open' | 'closed';
  voting_start: string | null;
  voting_end: string | null;
};

export type PendingVote = {
  category_id: string;
  category_name: string;
  contestant_id: string;
  contestant_name: string;
  points: number;
};
