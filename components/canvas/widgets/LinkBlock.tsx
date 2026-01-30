"use client";

import React, { useState, useEffect } from "react";
import { Link, FileText, Youtube, ExternalLink, X, Check, Twitter, Github, Music, Image as ImageIcon, Video, Codepen, MapPin, Figma, Instagram, MessageCircle } from "lucide-react";
import type { Widget } from "@/types/canvas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface LinkBlockProps {
    widget: Widget;
    onUpdate: (data: Partial<Widget>) => void;
}

// Helper to determine provider
const inferProvider = (linkUrl: string): 'youtube' | 'file' | 'generic' | 'twitter' | 'github' | 'spotify' | 'image' | 'video' | 'figma' | 'loom' | 'vimeo' | 'codepen' | 'map' | 'instagram' | 'reddit' => {
    const lowerUrl = linkUrl.toLowerCase();

    // Images
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(lowerUrl)) return 'image';

    // Videos
    if (/\.(mp4|webm|ogg|mov)$/i.test(lowerUrl)) return 'video';

    // Services
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
    if (lowerUrl.includes('github.com')) return 'github';
    if (lowerUrl.includes('spotify.com')) return 'spotify';
    if (lowerUrl.includes('figma.com')) return 'figma';
    if (lowerUrl.includes('loom.com')) return 'loom';
    if (lowerUrl.includes('vimeo.com')) return 'vimeo';
    if (lowerUrl.includes('codepen.io')) return 'codepen';
    if (lowerUrl.includes('maps.google.com') || lowerUrl.includes('google.com/maps')) return 'map';
    if (lowerUrl.includes('instagram.com')) return 'instagram';
    if (lowerUrl.includes('reddit.com')) return 'reddit';

    // Files
    const extension = lowerUrl.split('.').pop();
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'csv'].includes(extension || '')) {
        return 'file';
    }

    return 'generic';
};

// Renderers
const YoutubeRenderer = ({ url, title }: { url: string; title?: string }) => {
    const getYoutubeId = (linkUrl: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = linkUrl.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    return (
        <div className="aspect-video w-full">
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${getYoutubeId(url)}`}
                title={title || "YouTube video player"}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    );
};

const VimeoRenderer = ({ url, title }: { url: string; title?: string }) => {
    const getVimeoId = (linkUrl: string) => {
        // Simple parser for vimeo.com/123456
        const match = linkUrl.match(/vimeo\.com\/(\d+)/);
        return match ? match[1] : null;
    };

    const vimeoId = getVimeoId(url);

    if (!vimeoId) return <GenericRenderer url={url} title={title || "Vimeo Video"} />;

    return (
        <div className="aspect-video w-full">
            <iframe
                src={`https://player.vimeo.com/video/${vimeoId}`}
                width="100%"
                height="100%"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
                title={title || "Vimeo video player"}
            />
        </div>
    );
};

const LoomRenderer = ({ url, title }: { url: string; title?: string }) => {
    // Convert https://www.loom.com/share/ID -> https://www.loom.com/embed/ID
    const embedUrl = url.replace('/share/', '/embed/');
    return (
        <div className="aspect-video w-full">
            <iframe
                src={embedUrl}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                className="w-full h-full"
                title={title || "Loom video player"}
            />
        </div>
    );
};

const FigmaRenderer = ({ url, title }: { url: string; title?: string }) => {
    return (
        <div className="w-full h-[450px] border border-white/10 rounded-lg overflow-hidden">
            <iframe
                height="100%"
                width="100%"
                src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`}
                title={title || "Figma Design"}
                allowFullScreen
                className="bg-black/50"
            />
        </div>
    );
};

const CodepenRenderer = ({ url, title }: { url: string; title?: string }) => {
    // Attempt to convert /pen/ to /embed/
    // https://codepen.io/user/pen/slug -> https://codepen.io/user/embed/slug
    const embedUrl = url.replace('/pen/', '/embed/');
    return (
        <div className="w-full h-[400px] border border-white/10 rounded-lg overflow-hidden">
            <iframe
                height="100%"
                width="100%"
                src={`${embedUrl}?default-tab=result&theme-id=dark`}
                title={title || "CodePen Embed"}
                allowFullScreen
                className="bg-[#1e1e1e]" // Fallback bg
            />
        </div>
    );
};

const MapRenderer = ({ url, title }: { url: string; title?: string }) => {
    // If it's not an embed URL, just show a card to be safe
    if (!url.includes('/embed')) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full p-4 hover:bg-white/5 transition-colors group/map">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-full text-green-400">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-green-400/80 font-semibold text-sm">Google Maps</span>
                </div>
                <div className="pl-[3.25rem]">
                    <p className="text-white text-lg font-medium truncate">{title || "View Location"}</p>
                    <p className="text-white/40 text-xs truncate">{url}</p>
                </div>
            </a>
        );
    }

    return (
        <div className="w-full h-[350px] rounded-lg overflow-hidden grayscale-[50%] hover:grayscale-0 transition-[filter]">
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={url}
                title={title || "Google Maps"}
            ></iframe>
        </div>
    );
};

const InstagramRenderer = ({ url, title }: { url: string, title?: string }) => {
    const isReel = url.includes('/reel/');
    const isPost = url.includes('/p/');
    const displayType = isReel ? 'Reel' : isPost ? 'Post' : 'Profile';

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full p-4 hover:bg-white/5 transition-colors group/instagram bg-gradient-to-br from-[#833ab4]/10 via-[#fd1d1d]/10 to-[#fcb045]/10 border border-white/5 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-tr from-[#833ab4] via-[#fd1d1d] to-[#fcb045] rounded-lg text-white">
                    <Instagram className="w-5 h-5" />
                </div>
                <div className="">
                    <p className="text-white text-lg font-medium truncate">{title || `View Instagram ${displayType}`}</p>
                    <p className="text-white/40 text-xs truncate">{url}</p>
                </div>
            </div>
        </a>
    );
};

const RedditRenderer = ({ url, title }: { url: string, title?: string }) => {
    const isSubreddit = url.includes('/r/');
    const isUser = url.includes('/u/');
    const displayType = isSubreddit ? 'Subreddit' : isUser ? 'User' : 'Post';

    // Extract r/name or u/name for title
    let inferredTitle = title;
    if (!inferredTitle) {
        if (isSubreddit) {
            const match = url.match(/\/r\/([^/]*)/);
            if (match) inferredTitle = `r/${match[1]}`;
        } else if (isUser) {
            const match = url.match(/\/u\/([^/]*)/);
            if (match) inferredTitle = `u/${match[1]}`;
        }
    }

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full p-4 hover:bg-white/5 transition-colors group/reddit bg-[#FF4500]/5 border border-[#FF4500]/20 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#FF4500]/20 rounded-full text-[#FF4500]">
                    <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[#FF4500] font-semibold text-sm">Reddit {displayType}</span>
            </div>
            <div className="pl-[3.25rem]">
                <p className="text-white text-lg font-medium truncate">{inferredTitle || `View Reddit ${displayType}`}</p>
                <p className="text-white/40 text-xs truncate">{url}</p>
            </div>
        </a>
    );
};


const TwitterRenderer = ({ url, title }: { url: string, title?: string }) => {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full p-4 hover:bg-white/5 transition-colors group/twitter">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-[#1DA1F2]/20 rounded-full text-[#1DA1F2]">
                    <Twitter className="w-5 h-5" />
                </div>
                <span className="text-[#1DA1F2] font-semibold text-sm">Twitter / X</span>
            </div>
            <div className="pl-[3.25rem]">
                <p className="text-white text-lg font-medium truncate">{title || "View Tweet on X"}</p>
                <p className="text-white/40 text-xs truncate">{url}</p>
            </div>
        </a>
    );
};

const GithubRenderer = ({ url, title }: { url: string, title?: string }) => {
    const parts = url.replace("https://github.com/", "").split("/");
    const repoPath = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : url;

    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full p-4 hover:bg-white/5 transition-colors group/github">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/10 rounded-full text-white">
                    <Github className="w-5 h-5" />
                </div>
                <span className="text-white/80 font-semibold text-sm">GitHub</span>
            </div>
            <div className="pl-[3.25rem] border-l-2 border-white/10 ml-4 py-1">
                <p className="text-white text-lg font-mono font-medium truncate">{title || repoPath}</p>
                <p className="text-white/40 text-xs truncate mt-1">Repository</p>
            </div>
        </a>
    );
};

const SpotifyRenderer = ({ url }: { url: string }) => {
    const embedUrl = url.replace('open.spotify.com', 'open.spotify.com/embed');
    return (
        <div className="w-full h-[152px]">
            <iframe
                src={embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="encrypted-media"
                className="rounded-lg"
            />
        </div>
    );
};

const ImageRenderer = ({ url, title }: { url: string; title?: string }) => {
    return (
        <div className="relative w-full flex justify-center bg-black/40 p-2">
            <img src={url} alt={title || "Image content"} className="max-h-[500px] object-contain rounded" />
            {title && <div className="absolute bottom-2 left-2 right-2 bg-black/60 p-2 text-white text-xs rounded backdrop-blur-sm truncate">{title}</div>}
        </div>
    );
};

const VideoRenderer = ({ url, title }: { url: string; title?: string }) => {
    return (
        <div className="w-full bg-black/40">
            <video src={url} controls className="w-full max-h-[500px] rounded" title={title} />
        </div>
    );
};

const FileRenderer = ({ url, title }: { url: string; title?: string }) => {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group/link">
            <div className="w-12 h-12 rounded bg-blue-500/20 flex items-center justify-center text-blue-400">
                <FileText className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-base font-medium text-white truncate group-hover/link:underline">{title || url.split('/').pop()}</h4>
                <p className="text-xs text-white/50 truncate">{url}</p>
            </div>
        </a>
    );
};

const GenericRenderer = ({ url, title, description }: { url: string; title?: string; description?: string }) => {
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group/link">
            <div className="w-12 h-12 rounded bg-gray-500/20 flex items-center justify-center text-gray-400">
                <ExternalLink className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="text-base font-medium text-white truncate group-hover/link:underline">{title || url}</h4>
                <p className="text-xs text-white/50 truncate">{description || url}</p>
            </div>
        </a>
    );
};


export const LinkBlock: React.FC<LinkBlockProps> = ({ widget, onUpdate }) => {
    const [isEditing, setIsEditing] = useState(!widget.linkData?.url);
    const [urlInput, setUrlInput] = useState(widget.linkData?.url || "");
    const [titleInput, setTitleInput] = useState(widget.linkData?.title || "");

    const { url, title, description, provider } = widget.linkData || {};

    const handleSave = () => {
        if (!urlInput.trim()) return;

        const newProvider = inferProvider(urlInput);
        let newTitle = titleInput;

        if (!newTitle) {
            if (newProvider === 'file') newTitle = urlInput.split('/').pop() || 'File';
            if (newProvider === 'github') newTitle = urlInput.replace("https://github.com/", "");
        }

        onUpdate({
            linkData: {
                url: urlInput,
                title: newTitle,
                description: description || "",
                provider: newProvider,
            }
        });
        setIsEditing(false);
    };

    const renderContent = () => {
        if (!url) return null;

        switch (provider) {
            case 'youtube': return <YoutubeRenderer url={url} title={title} />;
            case 'vimeo': return <VimeoRenderer url={url} title={title} />;
            case 'loom': return <LoomRenderer url={url} title={title} />;
            case 'twitter': return <TwitterRenderer url={url} title={title} />;
            case 'instagram': return <InstagramRenderer url={url} title={title} />;
            case 'reddit': return <RedditRenderer url={url} title={title} />;
            case 'github': return <GithubRenderer url={url} title={title} />;
            case 'spotify': return <SpotifyRenderer url={url} />;
            case 'figma': return <FigmaRenderer url={url} title={title} />;
            case 'codepen': return <CodepenRenderer url={url} title={title} />;
            case 'map': return <MapRenderer url={url} title={title} />;
            case 'image': return <ImageRenderer url={url} title={title} />;
            case 'video': return <VideoRenderer url={url} title={title} />;
            case 'file': return <FileRenderer url={url} title={title} />;
            default: return <GenericRenderer url={url} title={title} description={description} />;
        }
    };

    return (
        <div className="w-full relative group bg-black/20 border border-white/5 rounded-lg overflow-hidden hover:border-white/10 transition-colors">
            {isEditing ? (
                <div className="p-4 flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Paste URL here..."
                            className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                        <Button size="sm" onClick={handleSave}>
                            <Check className="w-4 h-4 mr-1" /> Save
                        </Button>
                    </div>
                    <input
                        type="text"
                        placeholder="Title (optional)"
                        className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30"
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                </div>
            ) : (
                <div className="relative">
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 bg-black/50 hover:bg-black/70 text-white" onClick={() => setIsEditing(true)}>
                            <Link className="w-3 h-3" />
                        </Button>
                    </div>
                    {renderContent()}
                </div>
            )}
        </div>
    );
};
