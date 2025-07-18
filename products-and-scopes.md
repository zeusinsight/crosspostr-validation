Products

Login Kit
TikTok OAuth authentication handling login flows and token management. Stores credentials in Supabase database.

Content Posting API
Video upload system for TikTok. Publishes videos with metadata using TikTok's two-step upload process.

Scopes

user.info.basic
Basic user profile access for display name and open_id during login authentication.

user.info.profile
Extended profile information via TikTok API /v2/user/info/ endpoint.

video.list
Retrieves user's uploaded videos with pagination. Fetches views, likes, comments, and video details.

video.publish
Uploads and publishes videos using initialize then publish process. Supports file upload with privacy controls.

video.upload
Core upload functionality handling video content upload to TikTok servers via /v2/post/publish/video/init/ API.