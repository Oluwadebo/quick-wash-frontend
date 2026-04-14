export const updateTrustScore = (phoneNumber: string, delta: number) => {
  const allUsers = JSON.parse(localStorage.getItem('qw_all_users') || '[]');
  const updated = allUsers.map((u: any) => {
    if (u.phoneNumber === phoneNumber) {
      const newScore = Math.max(0, Math.min(100, (u.trustScore || 100) + delta));
      let status = u.status || 'Active';
      if (newScore < 30) status = 'Suspended';
      else if (newScore < 60) status = 'Restricted';
      else status = 'Active';
      
      return { ...u, trustScore: newScore, status };
    }
    return u;
  });
  localStorage.setItem('qw_all_users', JSON.stringify(updated));
  return updated;
};
