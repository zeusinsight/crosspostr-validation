'use client';

import { Button } from '@/components/ui/button';

export default function ConnectInstagramPage() {

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
    
    // These are the permissions required for publishing video reels to Instagram
    const scope = 'public_profile,instagram_basic,pages_show_list,instagram_content_publish';

    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code`;

    window.location.href = authUrl;
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Connect to Instagram</h1>
      <p className="mb-4">You need to connect a Facebook Page that is linked to your Instagram Professional account to enable publishing.</p>
      <Button onClick={handleConnect}>Connect Instagram Account</Button>
    </div>
  );
}
