"use client";

/**
 * Drop-in replacement for the lucide-react imports, rendering MDI.
 *
 * The app was drawing from three icon families at once — lucide's thin 2px strokes sitting
 * beside Material's filled shapes in the same toolbar. Manatal draws everything from MDI, so
 * everything here does too.
 *
 * Each export keeps its lucide name and prop shape, so converting a file is one changed import
 * line rather than a rewrite of every call site. `w-4 h-4` sizing is translated to a font size,
 * because an icon font is sized by font-size and those classes would otherwise do nothing.
 *
 * Generated from LUCIDE_TO_MDI in ds/iconMap.ts — edit the map, not this file.
 */

import React from "react";
import { Icon, type IconProps } from "./ds/Icon";

type LucideProps = Omit<IconProps, "name"> & { strokeWidth?: number | string };

const make = (mdi: string) => {
    // strokeWidth is swallowed on purpose: it is an SVG concept lucide call sites pass, and
    // an icon font has no strokes to widen. Forwarding it would put an invalid attribute on
    // the DOM node and log a React warning on every render.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const C = React.forwardRef<HTMLElement, LucideProps>(({ strokeWidth: _sw, ...rest }, ref) => (
        <Icon ref={ref} name={mdi} {...rest} />
    ));
    C.displayName = `Mdi(${mdi})`;
    return C;
};

export const Activity = make("pulse");
export const AlertCircle = make("alert-circle");
export const AlertTriangle = make("alert");
export const Archive = make("archive");
export const ArrowLeft = make("arrow-left");
export const ArrowRight = make("arrow-right");
export const ArrowUpRight = make("arrow-top-right");
export const AtSign = make("at");
export const Atom = make("atom");
export const Award = make("medal");
export const Badge = make("badge-account");
export const BarChart = make("chart-bar");
export const BarChart3 = make("chart-bar");
export const Bold = make("format-bold");
export const BookOpen = make("book-open-variant");
export const Bookmark = make("bookmark");
export const Bot = make("robot");
export const Brain = make("brain");
export const BrainCircuit = make("brain");
export const Briefcase = make("briefcase");
export const Building = make("office-building");
export const Building2 = make("office-building");
export const Calculator = make("calculator");
export const Calendar = make("calendar");
export const CalendarClock = make("calendar-clock");
export const CalendarRange = make("calendar-range");
export const Camera = make("camera");
export const Check = make("check");
export const CheckCircle2 = make("check-circle");
export const CheckSquare = make("checkbox-marked-outline");
export const ChevronDown = make("chevron-down");
export const ChevronLeft = make("chevron-left");
export const ChevronRight = make("chevron-right");
export const ChevronUp = make("chevron-up");
export const Circle = make("circle-outline");
export const CircleCheck = make("check-circle");
export const ClipboardList = make("clipboard-list");
export const Clock = make("clock-outline");
export const Code = make("code-tags");
export const Code2 = make("code-tags");
export const Copy = make("content-copy");
export const Cpu = make("chip");
export const DollarSign = make("currency-usd");
export const DraftingCompass = make("compass-outline");
export const Edit = make("pencil");
export const Edit2 = make("pencil");
export const Edit3 = make("pencil");
export const ExternalLink = make("open-in-new");
export const Eye = make("eye");
export const EyeOff = make("eye-off");
export const Facebook = make("facebook");
export const FileEdit = make("file-document-edit");
export const FileText = make("file-document-outline");
export const Filter = make("filter-variant");
export const FolderKanban = make("folder-multiple");
export const FolderOpen = make("folder-open");
export const Gift = make("gift");
export const Github = make("github");
export const Globe = make("earth");
export const GripVertical = make("drag-vertical");
export const HeartPulse = make("heart-pulse");
export const HelpCircle = make("help-circle");
export const History = make("history");
export const Image = make("image");
export const Inbox = make("inbox");
export const Info = make("information");
export const Instagram = make("instagram");
export const Italic = make("format-italic");
export const KeyRound = make("key");
export const Landmark = make("bank");
export const Layers = make("layers");
export const Layout = make("view-dashboard");
export const LayoutDashboard = make("view-dashboard");
export const LayoutGrid = make("view-grid");
export const LayoutTemplate = make("view-dashboard-variant");
export const Lightbulb = make("lightbulb");
export const Link = make("link-variant");
export const Link2 = make("link-variant");
export const Linkedin = make("linkedin");
export const List = make("format-list-bulleted");
export const ListChecks = make("format-list-checks");
export const ListOrdered = make("format-list-numbered");
export const ListPlus = make("playlist-plus");
export const Loader2 = make("loading");
export const Lock = make("lock");
export const LogIn = make("login");
export const Mail = make("email");
export const MapPin = make("map-marker");
export const Megaphone = make("bullhorn");
export const MessageSquare = make("message-text");
export const MessageSquareQuote = make("comment-quote");
export const MessagesSquare = make("forum");
export const Mic = make("microphone");
export const Mic2 = make("microphone-variant");
export const MicOff = make("microphone-off");
export const Minus = make("minus");
export const Monitor = make("monitor");
export const MoreHorizontal = make("dots-horizontal");
export const MoreVertical = make("dots-vertical");
export const Network = make("lan");
export const Paintbrush = make("brush");
export const Pause = make("pause");
export const Pencil = make("pencil");
export const Phone = make("phone");
export const PiggyBank = make("piggy-bank");
export const Pin = make("pin");
export const Play = make("play");
export const Plus = make("plus");
export const PlusCircle = make("plus-circle");
export const Radar = make("radar");
export const Redo2 = make("redo");
export const RefreshCcw = make("refresh");
export const RefreshCw = make("refresh");
export const Reply = make("reply");
export const Rocket = make("rocket");
export const RotateCcw = make("rotate-left");
export const Rss = make("rss");
export const Save = make("content-save");
export const Search = make("magnify");
export const SearchCode = make("text-search");
export const Send = make("send");
export const Settings = make("cog");
export const Settings2 = make("tune");
export const Share = make("share-variant");
export const Shield = make("shield");
export const ShieldAlert = make("shield-alert");
export const ShieldCheck = make("shield-check");
export const ShieldHalf = make("shield-half-full");
export const ShieldPlus = make("shield-plus");
export const SlidersHorizontal = make("tune");
export const Sparkles = make("auto-fix");
export const Square = make("square-outline");
export const Star = make("star");
export const Table2 = make("table");
export const Target = make("target");
export const Terminal = make("console");
export const ThumbsUp = make("thumb-up");
export const Timer = make("timer");
export const Trash2 = make("delete");
export const TrendingUp = make("trending-up");
export const Trophy = make("trophy");
export const Twitter = make("twitter");
export const Underline = make("format-underline");
export const Undo2 = make("undo");
export const Unplug = make("power-plug-off");
export const Upload = make("upload");
export const User = make("account");
export const UserCheck = make("account-check");
export const UserCircle = make("account-circle");
export const UserCog = make("account-cog");
export const UserPlus = make("account-plus");
export const UserX = make("account-remove");
export const Users = make("account-group");
export const Video = make("video");
export const VideoOff = make("video-off");
export const Wallet = make("wallet");
export const Wand2 = make("auto-fix");
export const Wrench = make("wrench");
export const X = make("close");
export const XCircle = make("close-circle");
export const Youtube = make("youtube");
export const Zap = make("lightning-bolt");
