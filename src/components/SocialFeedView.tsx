import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { stateService, validateImage } from '../lib/stateService';
import { RPGPost, RPGComment, UserProfile } from '../types';
import { getUserRank } from '../lib/rankSystem';
import AvatarImage from './AvatarImage';
import { SocialFeedImage } from './SocialFeedImage';
import { 
  Heart, MessageCircle, Send, Plus, Image, User, Users,
  CornerDownRight, Flame, ShieldAlert, Badge, HelpCircle, X, Trash2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Preset cybernetic illustrations for convenient posts templates
const POST_ART_TEMPLATES = [
  { id: 'art_workout', label: '🏋️ Body Protocol', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=80' },
  { id: 'art_stoic', label: '📖 Stoic Library', url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&q=80' },
  { id: 'art_finance', label: '🪙 Gold Vault', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&q=80' },
  { id: 'art_morning', label: '🌅 Dawn Focus', url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=400&q=80' }
];

export default function SocialFeedView() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<RPGPost[]>([]);
  const [postContent, setPostContent] = useState('');
  const [postImageUrl, setPostImageUrl] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [createPostPreviewUrl, setCreatePostPreviewUrl] = useState<string | null>(null);
  const [editPostPreviewUrl, setEditPostPreviewUrl] = useState<string | null>(null);
  
  // File upload state for post creation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Post inline editing states
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingImageUrl, setEditingImageUrl] = useState<string | null>(null);
  const [isEditingUploading, setIsEditingUploading] = useState(false);
  const [editingUploadError, setEditingUploadError] = useState<string | null>(null);

  const [postError, setPostError] = useState<string | null>(null);
  const [commentErrors, setCommentErrors] = useState<{ [postId: string]: string | null }>({});

  // Comments tracking state { [postId]: list_of_comments }
  const [commentsByPost, setCommentsByPost] = useState<{ [postId: string]: RPGComment[] }>({});
  const [activePostThreads, setActivePostThreads] = useState<Set<string>>(new Set());
  const [newCommentTexts, setNewCommentTexts] = useState<{ [postId: string]: string }>({});
  
  // Clicked profile card overlay popup
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);

  // Nested comments reply-to target tracking: { [postId]: commentId_to_reply_to }
  const [commentReplyTargets, setCommentReplyTargets] = useState<{ [postId: string]: string | null }>({});

  // Post deletion confirmation modal tracker
  const [postToDelete, setPostToDelete] = useState<RPGPost | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  useEffect(() => {
    // Subscribe to all post events
    const unsub = stateService.subscribeToPosts((feed) => {
      setPosts(feed);
    });
    return unsub;
  }, []);

  // Fetch comments for posts that have active threads opened
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];
    
    activePostThreads.forEach((postId) => {
      const unsub = stateService.subscribeToComments(postId, (commentsList) => {
        setCommentsByPost(prev => ({ ...prev, [postId]: commentsList }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach(u => u());
    };
  }, [activePostThreads]);

  // Load detailed clickable profile card overlay
  useEffect(() => {
    if (!selectedProfileId) {
      setSelectedUserProfile(null);
      return;
    }
    let isActive = true;
    stateService.getStaticUserProfile(selectedProfileId).then((profile) => {
      if (isActive) {
        setSelectedUserProfile(profile);
      }
    });
    return () => {
      isActive = false;
    };
  }, [selectedProfileId]);

  if (!user) return null;

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      // Validate image format and file size
      validateImage(file);

      // Create preview immediately
      const objectUrl = URL.createObjectURL(file);
      setCreatePostPreviewUrl(objectUrl);
      setPostImageUrl('');
      setSelectedTemplate('');

      setIsUploading(true);

      const url = await stateService.uploadMedia(file, 'posts', user.id);
      setUploadedImageUrl(url);

      // Clean preview reference
      URL.revokeObjectURL(objectUrl);
      setCreatePostPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      setUploadError(err?.message || 'Error occurred during image upload process.');
      setCreatePostPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset input element value to allow subsequent identical file uploads
      e.target.value = '';
    }
  };

  const handleUploadEditingImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditingUploadError(null);
    try {
      // Validate image format and file size
      validateImage(file);

      // Create preview
      const objectUrl = URL.createObjectURL(file);
      setEditPostPreviewUrl(objectUrl);

      setIsEditingUploading(true);

      const url = await stateService.uploadMedia(file, 'posts', user.id);
      setEditingImageUrl(url);

      // Clean preview reference
      URL.revokeObjectURL(objectUrl);
      setEditPostPreviewUrl(null);
    } catch (err: any) {
      console.error(err);
      setEditingUploadError(err?.message || 'Error occurred during image edit upload process.');
      setEditPostPreviewUrl(null);
    } finally {
      setIsEditingUploading(false);
      // Clean and safe handling of file input: reset value
      e.target.value = '';
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    setPostError(null);
    const imgToSave = uploadedImageUrl || selectedTemplate || postImageUrl.trim() || null;
    try {
      await stateService.createSocialPost(
        user.id,
        user.username,
        user.avatar,
        postContent.trim(),
        imgToSave
      );
      if (createPostPreviewUrl) {
        try { URL.revokeObjectURL(createPostPreviewUrl); } catch (e) {}
        setCreatePostPreviewUrl(null);
      }
      setPostContent('');
      setPostImageUrl('');
      setSelectedTemplate('');
      setUploadedImageUrl(null);
      setUploadError(null);
    } catch (err: any) {
      console.error(err);
      setPostError(err?.message || 'An error occurred while creating your post.');
    }
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editingContent.trim()) return;

    setEditingUploadError(null);
    try {
      await stateService.updateSocialPost(postId, user.id, {
        content: editingContent,
        imageUrl: editingImageUrl
      });
      if (editPostPreviewUrl) {
        try { URL.revokeObjectURL(editPostPreviewUrl); } catch (e) {}
        setEditPostPreviewUrl(null);
      }
      setEditingPostId(null);
    } catch (err: any) {
      console.error(err);
      setEditingUploadError(err?.message || 'Error occurred during edit save process.');
    }
  };

  const handleDeletePost = async (postId: string) => {
    setIsDeletingPost(true);
    try {
      await stateService.deleteSocialPost(postId, user.id);
      setPostToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await stateService.toggleLikePost(postId, user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCommentsThread = (postId: string) => {
    setActivePostThreads(prev => {
      const copy = new Set(prev);
      if (copy.has(postId)) {
        copy.delete(postId);
      } else {
        copy.add(postId);
      }
      return copy;
    });
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = newCommentTexts[postId] || '';
    if (!text.trim()) return;

    setCommentErrors(prev => ({ ...prev, [postId]: null }));
    const parentId = commentReplyTargets[postId] || null;

    try {
      await stateService.addComment(
        postId,
        user.id,
        user.username,
        user.avatar,
        text.trim(),
        parentId
      );

      // Wipe triggers
      setNewCommentTexts(prev => ({ ...prev, [postId]: '' }));
      setCommentReplyTargets(prev => ({ ...prev, [postId]: null }));
    } catch (err: any) {
      console.error(err);
      setCommentErrors(prev => ({ ...prev, [postId]: err?.message || 'Failed to add comment.' }));
    }
  };

  // Helper nested comment structuring: transforms raw flat comments to tree
  const buildCommentTree = (flatComments: RPGComment[]): RPGComment[] => {
    const map = new Map<string, RPGComment & { replies: RPGComment[] }>();
    const roots: RPGComment[] = [];

    // Initialize map with deep clones
    flatComments.forEach(c => {
      map.set(c.id, { ...c, replies: [] });
    });

    flatComments.forEach(c => {
      const node = map.get(c.id)!;
      if (c.parentCommentId && map.has(c.parentCommentId)) {
        map.get(c.parentCommentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderPostCard = (post: RPGPost) => {
    const openThread = activePostThreads.has(post.id);
    const isLiked = post.likes.includes(user.id);
    const rawComments = commentsByPost[post.id] || [];
    const commentTree = buildCommentTree(rawComments);
    const isEditingThisPost = editingPostId === post.id;

    if (isEditingThisPost) {
      return (
        <div 
          key={post.id}
          className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 overflow-hidden shadow-lg p-5 flex flex-col gap-4 text-left"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400 rotate-45" />
              <span className="font-display font-semibold text-xs text-slate-100 uppercase tracking-widest">
                EDIT PROGRESS CHRONICLE
              </span>
            </div>
            <span className="font-mono text-[8.5px] text-indigo-400 uppercase">EDITING ACTIVE</span>
          </div>

          {/* Text content edit input */}
          <textarea
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            placeholder="Modify your discipline report coordinates..."
            className="w-full h-20 px-3.5 py-2 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 outline-none resize-none font-sans"
          />

          {/* Image Edit Section */}
          <div className="flex flex-col gap-2.5">
            <span className="text-[10px] text-slate-500 font-mono uppercase">EDIT PROGRESS PHOTO:</span>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={editingImageUrl || ''}
                onChange={(e) => {
                  setEditingImageUrl(e.target.value || null);
                }}
                disabled={isEditingUploading}
                placeholder="Paste custom image URL..."
                className="px-3.5 py-1.5 rounded bg-black/40 border border-slate-800/80 text-[11px] text-slate-350 focus:outline-none focus:border-indigo-500 outline-none font-sans disabled:opacity-50"
              />

              <label className="flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-slate-800 hover:border-slate-700/80 hover:bg-white/5 transition-all text-[11px] font-mono text-slate-405 cursor-pointer">
                <Image className="w-3.5 h-3.5 text-indigo-400" />
                <span>{isEditingUploading ? 'UPLOADING...' : 'UPLOAD NEW FILE'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleUploadEditingImage}
                  disabled={isEditingUploading}
                  className="hidden"
                />
              </label>
            </div>

            {(editPostPreviewUrl || editingImageUrl) ? (
              <div className="relative w-full h-32 rounded-lg overflow-hidden border border-indigo-500/2 transition-all mt-1">
                <img
                  src={editPostPreviewUrl || editingImageUrl || ''}
                  alt="Edit preview progress"
                  className={`w-full h-full object-cover ${isEditingUploading ? 'opacity-40 blur-[1px]' : ''}`}
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (editPostPreviewUrl) {
                      try { URL.revokeObjectURL(editPostPreviewUrl); } catch (e) {}
                      setEditPostPreviewUrl(null);
                    }
                    setEditingImageUrl(null);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 hover:bg-black text-slate-400 hover:text-white transition-all border border-white/10"
                  disabled={isEditingUploading}
                >
                  <X className="w-3 h-3" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 text-[8px] font-mono bg-black/80 text-pink-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                  {isEditingUploading ? 'UPLOADING...' : editPostPreviewUrl ? 'Local Preview' : 'Preview Image Attached'}
                </span>
                {isEditingUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <RefreshCw className="w-5 h-5 animate-spin text-pink-400" />
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 text-center rounded border border-dashed border-slate-800 text-slate-500 text-[10px] font-mono uppercase bg-black/20">
                No Image Attached to Post
              </div>
            )}
            
            {editingUploadError && (
              <span className="text-[10px] font-mono text-pink-400 block">{editingUploadError}</span>
            )}
          </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (editPostPreviewUrl) {
                    try { URL.revokeObjectURL(editPostPreviewUrl); } catch (e) {}
                    setEditPostPreviewUrl(null);
                  }
                  setEditingPostId(null);
                }}
                className="px-4 py-1.5 rounded border border-slate-800 bg-black/40 text-slate-400 hover:text-white hover:border-slate-700 text-xs font-mono transition-all lowercase"
              >
                [cancel]
              </button>
            <button
              type="button"
              onClick={() => handleSaveEdit(post.id)}
              disabled={!editingContent.trim() || isEditingUploading}
              className="px-5 py-2 bg-indigo-600 text-white shadow-[0_0_8px_rgba(99,102,241,0.2)] hover:opacity-95 text-xs font-display font-medium clip-cyber uppercase cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
            >
              SAVE CHANGES
            </button>
          </div>

        </div>
      );
    }

    return (
      <div 
        key={post.id}
        className="rounded-xl border border-white/10 bg-white/5 overflow-hidden shadow-lg p-5 flex flex-col gap-4 text-left"
      >
        {/* Author Meta Details row */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedProfileId(post.userId)}
            id={`view-profile-btn-${post.id}`}
            className="flex items-center gap-2.5 text-left outline-none group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg overflow-hidden border border-white/5 group-hover:border-indigo-400 transition-colors flex items-center justify-center">
              <AvatarImage
                src={post.authorAvatar}
                alt={post.authorName}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-display font-bold text-xs text-slate-100 block group-hover:text-glow-blue group-hover:text-indigo-400 transition-colors pointer-events-none">
                {post.authorName}
              </span>
              <span className="font-mono text-[9px] text-slate-500 block uppercase">
                {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </button>
          
          <div className="flex items-center gap-2">
            {post.userId === user.id && (
              <>
                <button
                  onClick={() => {
                    setEditingPostId(post.id);
                    setEditingContent(post.content);
                    setEditingImageUrl(post.imageUrl);
                    setEditingUploadError(null);
                  }}
                  id={`edit-post-btn-${post.id}`}
                  className="font-mono text-[9.5px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all font-bold uppercase cursor-pointer px-2 py-0.5 rounded border border-indigo-500/20 bg-indigo-500/5 mr-1"
                >
                  EDIT
                </button>
                <button
                  onClick={() => {
                    setPostToDelete(post);
                  }}
                  id={`delete-post-btn-${post.id}`}
                  className="font-mono text-[9.5px] text-pink-500 hover:text-pink-400 hover:bg-pink-500/10 transition-all font-bold uppercase cursor-pointer px-2 py-0.5 rounded border border-pink-500/20 bg-pink-500/5 mr-1 flex items-center gap-1"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  DELETE
                </button>
              </>
            )}
            <span className="font-mono text-[8.5px] text-slate-500 uppercase">FEED SECURE</span>
          </div>
        </div>

        {/* Content space */}
        <p className="font-sans text-xs text-slate-200 leading-relaxed font-light break-words">
          {post.content}
        </p>

        {/* Attachment Illustration image preview with dynamic SocialFeedImage rendering */}
        {post.imageUrl && (
          <SocialFeedImage
            imageUrl={post.imageUrl}
            alt="Community upload progress"
          />
        )}

        {/* Actions bar rows */}
        <div className="pt-3 border-t border-slate-900/80 flex items-center gap-4 text-xs font-mono text-slate-400">
          <button
            onClick={() => handleToggleLike(post.id)}
            id={`like-post-btn-${post.id}`}
            className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
              isLiked ? 'text-pink-400 font-bold' : 'hover:text-pink-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500 stroke-pink-400' : ''}`} />
            <span>{post.likesCount} LIKES</span>
          </button>

          <button
            onClick={() => handleToggleCommentsThread(post.id)}
            id={`comment-toggle-btn-${post.id}`}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount} DISCUSSIONS</span>
          </button>
        </div>

        {/* ACCORDION THREAD COMMENTS DRAWER CONTAINER */}
        {openThread && (
          <div className="pt-4 border-t border-slate-900 bg-black/25 -mx-5 -mb-5 px-5 pb-5">
            
            {/* Nested comments reply indices tree */}
            <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto mb-4 pr-1">
              {rawComments.length === 0 ? (
                <div className="py-5 text-center text-slate-500 font-mono text-[10px]">
                  THREAD VACANT. TRANSMIT INITIATION REPLY BELOW.
                </div>
              ) : (
                // Render nested comment tree
                commentTree.map((rootComment) => (
                  <div key={rootComment.id} className="flex flex-col gap-2">
                    {/* Master Comment */}
                    <div className="p-3 rounded bg-black/40 border border-slate-900 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setSelectedProfileId(rootComment.userId)}
                            id={`view-profile-root-btn-${rootComment.id}`}
                            className="flex items-center gap-1.5 text-left outline-none cursor-pointer"
                          >
                            <div className="w-4.5 h-4.5 rounded overflow-hidden flex items-center justify-center shrink-0">
                              <AvatarImage
                                src={rootComment.authorAvatar}
                                alt={rootComment.authorName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-display font-medium text-[11px] text-pink-200 pointer-events-none">
                              {rootComment.authorName}
                            </span>
                          </button>
                        </div>
                        <span className="font-mono text-[8px] text-slate-500">
                          {new Date(rootComment.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="font-sans text-[11px] text-slate-300 pl-6 break-words">
                        {rootComment.content}
                      </p>
                      {/* Nested toggle trigger button */}
                      <div className="flex justify-end pl-6">
                        <button
                          onClick={() => setCommentReplyTargets(prev => ({ 
                            ...prev, 
                            [post.id]: commentReplyTargets[post.id] === rootComment.id ? null : rootComment.id 
                          }))}
                          id={`reply-to-btn-${rootComment.id}`}
                          className="text-[9px] font-mono text-indigo-405 hover:text-white transition-all uppercase"
                        >
                          [REPLY]
                        </button>
                      </div>
                    </div>

                    {/* Child Nested Replies Rendering */}
                    {rootComment.replies && rootComment.replies.map((reply) => (
                      <div key={reply.id} className="pl-6 flex items-start gap-2">
                        <CornerDownRight className="w-3.5 h-3.5 text-slate-700 mt-1 shrink-0" />
                        <div className="flex-grow p-3 rounded bg-black/20 border border-slate-900/50 flex flex-col gap-1.5 text-left">
                          <div className="flex items-center justify-between">
                            <button 
                              onClick={() => setSelectedProfileId(reply.userId)}
                              id={`view-profile-reply-btn-${reply.id}`}
                              className="flex items-center gap-1.5 text-left outline-none cursor-pointer"
                            >
                              <div className="w-4 h-4 rounded overflow-hidden flex items-center justify-center shrink-0">
                                <AvatarImage
                                  src={reply.authorAvatar}
                                  alt={reply.authorName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <span className="font-display font-medium text-[10.5px] text-cyan-200 pointer-events-none">
                                {reply.authorName}
                              </span>
                            </button>
                            <span className="font-mono text-[8px] text-slate-600">
                              {new Date(reply.createdAt).toLocaleDateString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-sans text-[10.5px] text-slate-350 pl-5 break-words">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {commentErrors[post.id] && (
              <span className="text-[10.5px] font-mono text-pink-400 block mb-2.5 px-1">
                ⚠️ {commentErrors[post.id]}
              </span>
            )}

            {/* Comment submission form */}
            <form onSubmit={(e) => handleAddComment(post.id, e)} className="flex items-center gap-2">
              {commentReplyTargets[post.id] && (
                <div className="px-2.5 py-1.5 rounded bg-pink-950/20 border border-pink-500/20 text-[9px] font-mono text-pink-300 flex items-center gap-1 shrink-0">
                  <span>REPLYING TO NEST</span>
                  <button 
                    type="button" 
                    onClick={() => setCommentReplyTargets(prev => ({ ...prev, [post.id]: null }))}
                    className="hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                type="text"
                value={newCommentTexts[post.id] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewCommentTexts(prev => ({ ...prev, [post.id]: val }));
                }}
                placeholder={commentReplyTargets[post.id] ? "Compose nested reply..." : "Add to discussion loop..."}
                className="flex-grow px-3 py-1.5 text-xs rounded bg-black/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 outline-none font-sans"
              />
              <button
                type="submit"
                id={`submit-comment-btn-${post.id}`}
                className="p-1.5 rounded bg-indigo-950 border border-indigo-500/30 text-indigo-400 hover:text-white transition-all cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT COLUMN MAIN FEED CHRONICLES */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        
        {/* POST SUBMITTER ENVELOPE */}
        <div className="p-5 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Plus className="w-4 h-4 text-indigo-400" />
            <span className="font-display font-semibold text-xs text-slate-100 uppercase tracking-widest">
              SHARE RPG ADVENTURE PROGRESS
            </span>
          </div>

          <form onSubmit={handleCreatePost} className="flex flex-col gap-3">
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="What tasks or challenges did you complete today? Inspire other characters with your discipline metrics..."
              className="w-full h-20 px-3.5 py-2 rounded-lg bg-black/60 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 outline-none resize-none font-sans"
            />

            {/* Illustration Selector / Preset URLs */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-slate-500 font-mono uppercase">OR INCLUDE PROGRESS ILLUSTRATION PHOTO:</span>
              <div className="flex gap-2 flex-wrap">
                {POST_ART_TEMPLATES.map((art) => {
                  const isSelected = selectedTemplate === art.url;
                  return (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(isSelected ? '' : art.url);
                        setPostImageUrl('');
                      }}
                      className={`px-2.5 py-1 rounded text-[10px] font-mono border transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.2)]' 
                          : 'border-slate-800 bg-black/40 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {art.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom uploaded / custom Image input URL options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                <input
                  type="text"
                  value={postImageUrl}
                  onChange={(e) => {
                    setPostImageUrl(e.target.value);
                    setUploadedImageUrl(null);
                    setSelectedTemplate('');
                  }}
                  placeholder="Or paste custom image Unsplash link etc..."
                  className="px-3.5 py-1.5 rounded bg-black/40 border border-slate-800/80 text-[11px] text-slate-350 focus:outline-none focus:border-indigo-500 outline-none font-sans"
                />

                <label className="flex items-center justify-center gap-2 px-3 py-1.5 rounded bg-black/40 border border-slate-800 hover:border-slate-700/80 hover:bg-white/5 transition-all text-[11px] font-mono text-slate-450 cursor-pointer h-full">
                  <Image className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{isUploading ? 'UPLOADING...' : 'UPLOAD IMAGE FILE'}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleUploadImage}
                    disabled={isUploading}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Dynamic Image Attached Preview indicator */}
              {(createPostPreviewUrl || uploadedImageUrl || selectedTemplate || postImageUrl) && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-white/5 mt-1">
                  <img
                    src={createPostPreviewUrl || uploadedImageUrl || selectedTemplate || postImageUrl || ''}
                    alt="Attaching upload progress preview"
                    className={`w-full h-full object-cover opacity-90 ${isUploading ? 'opacity-40 blur-[1px]' : ''}`}
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (createPostPreviewUrl) {
                        try { URL.revokeObjectURL(createPostPreviewUrl); } catch (e) {}
                        setCreatePostPreviewUrl(null);
                      }
                      setUploadedImageUrl(null);
                      setPostImageUrl('');
                      setSelectedTemplate('');
                    }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/80 hover:bg-black text-slate-400 hover:text-white transition-all border border-white/10"
                    disabled={isUploading}
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 text-[8px] font-mono bg-black/80 text-indigo-400 px-1.5 py-0.5 rounded border border-white/5 uppercase">
                    {isUploading ? 'UPLOADING...' : createPostPreviewUrl ? 'Local Preview' : uploadedImageUrl ? 'Uploaded File' : selectedTemplate ? 'Preset Illustration' : 'Pasted URL'}
                  </span>
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    </div>
                  )}
                </div>
              )}
              {uploadError && (
                <span className="text-[10px] font-mono text-pink-400 mt-1 block">{uploadError}</span>
              )}
            </div>

            {postError && (
              <span className="text-xs font-mono text-pink-400 mt-1 block leading-normal border border-pink-500/20 bg-pink-950/20 px-3 py-2 rounded-lg">
                ⚠️ {postError}
              </span>
            )}

            {/* Confirm buttons */}
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] font-mono text-slate-500">AWARD: +20 MINDSET XP ON COMPILE</span>
              <button
                type="submit"
                disabled={!postContent.trim() || isUploading}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)] hover:opacity-95 text-xs font-display font-medium clip-cyber uppercase cursor-pointer transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                COMPILE POST MESH
              </button>
            </div>
          </form>
        </div>

        {/* FEED LOG TIMELINE ROWS -- INSTAGRAM-STYLE MASONRY CSS COLUMNS */}
        <div className="w-full">
          {posts.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-dashed border-slate-800/80 text-slate-500 text-xs font-mono w-full">
              COMMUNICATION CHANNEL VACANT. COMPILE FIRST REPORT ABOVE.
            </div>
          ) : (
            <div className="columns-1 md:columns-2 gap-5 [column-fill:_auto] w-full">
              {posts.map((post) => (
                <div key={post.id} className="break-inside-avoid mb-5 inline-block w-full">
                  {renderPostCard(post)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN ACTIVE USERS LEADERBOARD RADAR INDEX */}
      <div className="lg:col-span-4 flex flex-col gap-5">
        
        {/* SATELLITE USER BRIEF */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-200">
            <Users className="w-4 h-4 text-indigo-400" />
            <h4 className="font-display font-semibold text-xs uppercase tracking-wide">
              YOUR SOCIAL IDENTITY
            </h4>
          </div>
          <div className="p-3 bg-black/40 rounded-lg border border-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-850 flex items-center justify-center shrink-0">
              <AvatarImage
                src={user.avatar}
                alt="Avatar avatar preview"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="font-display font-medium text-xs text-white block">{getUserRank(user.level).badge} {user.username}</span>
              <span className="font-mono text-[9px] text-indigo-400 block uppercase">{getUserRank(user.level).name} • Level {user.level}</span>
            </div>
          </div>
        </div>

        {/* NEW: PEOPLE ACTIVE TODAY DECK */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h4 className="font-display font-semibold text-xs uppercase tracking-wide">
                GUARDIANS ACTIVE TODAY
              </h4>
            </div>
            <span className="font-mono text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10">
              6 ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "Lyra Vane", avatar: "avatar_2.png", streak: 12, action: "Breathing done" },
              { name: "Kaelen Stoic", avatar: "avatar_5.png", streak: 8, action: "Sunlight done" },
              { name: "Elena Code", avatar: "avatar_3.png", streak: 15, action: "Chore cleared" },
              { name: "Vera Jade", avatar: "avatar_6.png", streak: 4, action: "Water drank" },
              { name: "Zephyr Fin", avatar: "avatar_7.png", streak: 19, action: "Course lock" },
              { name: user.username, avatar: user.avatar, streak: user.streak, action: "Online now" }
            ].map((guy, gIdx) => (
              <div 
                key={gIdx} 
                className="p-2 bg-black/40 border border-white/5 rounded-lg flex items-center gap-2 hover:bg-black/60 transition-all select-none"
              >
                <div className="w-7 h-7 rounded overflow-hidden border border-slate-800 flex items-center justify-center shrink-0">
                  <AvatarImage src={guy.avatar} alt={guy.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-200 block truncate font-medium">{guy.name}</span>
                  <span className="text-[8px] text-emerald-400 font-mono block truncate uppercase">{guy.action} • {guy.streak}d🔥</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: TRENDING CHRONICLES INDEX */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-slate-200 pb-2 border-b border-white/5">
            <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
            <h4 className="font-display font-semibold text-xs uppercase tracking-wide">
              TRENDING BROADCASTS MATRIX
            </h4>
          </div>

          <div className="space-y-3">
            {[
              { author: "Lyra Vane", body: "Completed 5 consecutive Breathing calibrations! Stabilizing circadian rhythms has fully transformed morning coding sprints.", hotness: "🔥 12 likes" },
              { author: "Zephyr Fin", body: "Finally unlocked the 'Divine Scholar' Badge after conquering the React & Firebase full-stack architecture lessons! Highly recommended.", hotness: "🔥 8 likes" }
            ].map((trend, tIdx) => (
              <div key={tIdx} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-display font-bold text-indigo-300">{trend.author}</span>
                  <span className="font-mono text-[9px] text-slate-500 uppercase">{trend.hotness}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 lines-clamp-2 leading-relaxed font-sans">
                  "{trend.body}"
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* NEW: LIVE BROADCAST TAPE (FOMO TELEMETRY ALERT) */}
        <div className="p-4 rounded-xl bg-orange-500/5 border border-dashed border-orange-500/25 flex flex-col gap-1.5 animate-pulse">
          <span className="font-mono text-[8px] text-orange-400 block uppercase font-bold tracking-widest">LIVE DISPATCH DECK</span>
          <p className="text-[10.5px] text-slate-300 font-sans leading-relaxed">
            ⚡ <strong>Kaelen Stoic</strong> secured the "Circadian Solar Lock-In" Daily Challenge! (+100 XP gained and streak extended to 8 days).
          </p>
        </div>

        {/* FEED USABILITY MANUAL */}
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 font-sans text-[11px] text-slate-400 leading-relaxed space-y-2">
          <span className="text-[10px] text-slate-500 font-mono uppercase block">CHRONICLES HANDBOOK:</span>
          <p>• Share real world activities coordinates using the submission post mesh on the left core timeline boards.</p>
          <p>• Review logs published by cyber-companion indices. Toggle like icons or open the nested comment threads inside each card grid.</p>
          <p>• Click companion avatars to deploy detailed RPG profile scanners showing their statistics, streaks and badges.</p>
        </div>
      </div>

      {/* FLOATING DIALOG CARD OVERLAY DETAILED SCANNER */}
      <AnimatePresence>
        {selectedProfileId && selectedUserProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-[#090818] border border-white/10 p-6 relative overflow-hidden backdrop-blur-xl"
            >
              <button
                onClick={() => setSelectedProfileId(null)}
                id="close-profile-scanner-btn"
                className="absolute top-4 right-4 p-1.5 rounded bg-black/40 border border-slate-800 text-slate-400 hover:text-white transition-all outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center pb-4 border-b border-white/5">
                <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-white/10 bg-black/50 mb-3 flex items-center justify-center">
                  <AvatarImage
                    src={selectedUserProfile.avatar}
                    alt={selectedUserProfile.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wide">
                  {selectedUserProfile.username}
                </h3>
                <span className="font-mono text-[9px] text-indigo-400 tracking-wider uppercase block mt-0.5 font-bold">
                  {getUserRank(selectedUserProfile.level).badge} {getUserRank(selectedUserProfile.level).name} (LEVEL {selectedUserProfile.level})
                </span>

                <div className="flex gap-4 mt-4 font-mono text-xs">
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-900">
                    <span className="text-slate-500 block text-[9px] uppercase">RPG XP</span>
                    <span className="text-slate-200 font-bold block">{selectedUserProfile.totalXp}</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-black/40 border border-slate-900">
                    <span className="text-slate-500 block text-[9px] uppercase">STREAK</span>
                    <span className="text-orange-400 font-bold block">🔥 {selectedUserProfile.streak} DAYS</span>
                  </div>
                </div>
              </div>

              {/* Character Attributes progress radars */}
              <div className="py-4 space-y-2.5 border-b border-white/5">
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-1">RPG SKILL ATTRIBUTES:</span>
                
                {Object.entries(selectedUserProfile.skills).map(([skName, progress]: [string, any]) => {
                  const percent = Math.min(100, (progress.xp / (progress.level * 100)) * 100);
                  return (
                    <div key={skName} className="font-mono text-[10px]">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="text-slate-350 uppercase">{skName}</span>
                        <span className="text-slate-400">Lvl {progress.level}</span>
                      </div>
                      <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Badges unlocked listed */}
              <div className="pt-4">
                <span className="text-[9px] font-mono text-slate-500 uppercase block mb-2">GOLDEN BADGES GAINED ({selectedUserProfile.badges.length}):</span>
                <div className="flex gap-1.5 flex-wrap">
                  {selectedUserProfile.badges.map((b, idx) => (
                    <span
                      key={idx}
                      title={b.description}
                      className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[9px] text-purple-300 font-mono uppercase"
                    >
                      ★ {b.title}
                    </span>
                  ))}
                  {selectedUserProfile.badges.length === 0 && (
                    <span className="text-[10px] font-mono text-slate-500 uppercase">NO GOLDEN BADGES UNLOCKED YET.</span>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* POST DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl bg-[#0a0914] border border-red-500/20 p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl text-center"
            >
              <div className="flex flex-col gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-semibold text-xs uppercase text-slate-100 tracking-wider">
                    DELETE POST?
                  </h3>
                  <p className="text-[11.5px] text-slate-400">
                    Do you want to delete this post?
                  </p>
                </div>

                <div className="p-3 bg-black/40 rounded-lg border border-slate-900 w-full text-left max-h-24 overflow-y-auto">
                  <p className="text-[10.5px] font-sans text-slate-300 italic line-clamp-3">
                    "{postToDelete.content}"
                  </p>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={() => setPostToDelete(null)}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all lowercase"
                  >
                    [cancel]
                  </button>
                  <button
                    onClick={() => handleDeletePost(postToDelete.id)}
                    disabled={isDeletingPost}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 border border-red-500 text-white rounded-lg text-xs font-display font-medium transition-all uppercase disabled:opacity-50"
                  >
                    {isDeletingPost ? 'DELETING...' : 'YES, DELETE'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
