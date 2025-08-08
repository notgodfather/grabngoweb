
export default function UserProfile({ profile, onLogout }) {

if (!profile) return null;

return (

<div style={{ marginTop: 16 }}> - <img src={profile.picture} alt="profile" width={48} height={48} style={{ borderRadius: '50%' }} /> - <div>Name: {profile.name}</div> - <div>Email: {profile.email}</div> - <button style={{ marginTop: 12 }} onClick={onLogout}>Logout</button>
</div>
);

}