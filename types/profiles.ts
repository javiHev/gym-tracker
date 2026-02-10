export interface UserProfile {
    id: string;
    name: string;
    email: string;
    weight: number;
    height: number;
    units: 'metric' | 'imperial';
    created_at?: string;
}
