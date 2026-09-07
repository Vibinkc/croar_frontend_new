/**
 * Icon name map — every glyph the app used, expressed in MDI.
 *
 * Croar was running three icon families at once: Google's Material Symbols Rounded (158
 * glyphs), Material Icons Outlined (56), and lucide-react (162). Three families is not a
 * stylistic choice, it is three different pens on one page — lucide's thin 2px strokes next to
 * Material's filled shapes, in the same toolbar.
 *
 * Manatal is a Vuetify product and draws everything from MDI (Pictogrammers), which is why its
 * icons read as one set. This map is what lets the whole app land on that set.
 *
 * Names are kept as the KEY so nothing else has to change: the nav config, the page code and
 * the guide all still say `work` or `person_add`, and only the rendering resolves to MDI. A
 * name with no entry falls back to a neutral dot rather than rendering an empty box, so a
 * missed glyph is visible in review instead of silently absent.
 */

/** Material Symbols Rounded + Material Icons Outlined → MDI. */
export const MATERIAL_TO_MDI: Record<string, string> = {
    // Navigation / chrome
    close: "close", menu: "menu", more_vert: "dots-vertical", search: "magnify",
    search_off: "magnify-close", arrow_back: "arrow-left", arrow_forward: "arrow-right",
    arrow_upward: "arrow-up", arrow_downward: "arrow-down", arrow_right_alt: "arrow-right",
    arrow_forward_ios: "chevron-right", arrow_circle_right: "arrow-right-circle",
    chevron_left: "chevron-left", chevron_right: "chevron-right",
    expand_more: "chevron-down", expand_less: "chevron-up",
    keyboard_arrow_down: "chevron-down", unfold_more: "unfold-more-horizontal",
    dock_to_right: "dock-right", apps: "apps", drag_indicator: "drag",

    // Actions
    add: "plus", add_circle: "plus-circle", add_box: "plus-box", remove: "minus",
    do_not_disturb_on: "minus-circle", delete: "delete", edit: "pencil",
    edit_note: "note-edit", edit_square: "square-edit-outline", check: "check",
    check_circle: "check-circle", task_alt: "check-circle-outline", done_all: "check-all",
    cancel: "close-circle", refresh: "refresh", sync: "sync", undo: "undo", redo: "redo",
    download: "download", upload: "upload", upload_file: "file-upload",
    content_copy: "content-copy", print: "printer", send: "send", share: "share-variant",
    link: "link-variant", link_off: "link-off", open_in_new: "open-in-new",
    attach_file: "paperclip", play_arrow: "play", play_circle: "play-circle",
    add_task: "playlist-plus", add_comment: "comment-plus",

    // Status
    error: "alert-circle", error_outline: "alert-circle-outline", warning: "alert",
    info: "information", help: "help-circle", help_center: "help-circle",
    new_releases: "new-box", verified: "check-decagram", pending_actions: "clipboard-clock",
    block: "block-helper", hourglass_empty: "timer-sand-empty", progress_activity: "loading",
    celebration: "party-popper", visibility: "eye", visibility_off: "eye-off",

    // People
    person: "account", person_add: "account-plus", person_off: "account-off",
    person_search: "account-search", account_circle: "account-circle", group: "account-group",
    group_off: "account-off", manage_accounts: "account-cog", how_to_reg: "account-check",
    record_voice_over: "account-voice", badge: "badge-account",

    // Work / hiring
    work: "briefcase", work_off: "briefcase-off", work_outline: "briefcase-outline",
    apartment: "office-building", business: "office-building", corporate_fare: "domain",
    domain: "domain", account_balance: "bank", school: "school", history_edu: "school",
    travel_explore: "earth", explore: "compass",

    // Content
    description: "file-document-outline", assignment: "clipboard-text",
    fact_check: "clipboard-check", list: "format-list-bulleted",
    list_alt: "format-list-bulleted-square",
    summarize: "text-box", topic: "folder-text", inventory_2: "package-variant-closed",
    receipt_long: "receipt", request_quote: "file-document-edit", quiz: "help-box",
    rate_review: "comment-text", chat_bubble_outline: "comment-outline", forum: "forum",
    menu_book: "book-open-page-variant", campaign: "bullhorn", rule: "format-list-checks",

    // Folders
    folder: "folder", folder_open: "folder-open", folder_off: "folder-remove",
    folder_managed: "folder-cog",

    // Mail
    mail: "email", email: "email", mail_off: "email-off", drafts: "email-open",
    mark_email_read: "email-check", mark_email_unread: "email-mark-as-unread",
    inbox: "inbox", alternate_email: "at",

    // Time
    schedule: "clock-outline", history: "history", calendar_today: "calendar",
    calendar_month: "calendar-month", event: "calendar", event_available: "calendar-check",
    event_busy: "calendar-remove", event_repeat: "calendar-refresh",

    // Charts
    analytics: "chart-box", bar_chart: "chart-bar", show_chart: "chart-line",
    donut_large: "chart-donut", insights: "chart-timeline-variant", monitoring: "monitor-dashboard",
    trending_up: "trending-up", poll: "poll", table_chart: "table", radar: "radar",
    view_kanban: "view-column", account_tree: "file-tree",
    dashboard_customize: "view-dashboard-edit",

    // AI
    smart_toy: "robot", psychology: "brain", neurology: "brain", auto_awesome: "auto-fix",
    auto_fix_high: "auto-fix", magic_button: "auto-fix", lightbulb: "lightbulb",
    science: "flask", bolt: "lightning-bolt", rocket_launch: "rocket-launch",
    architecture: "ruler-square",

    // Security
    lock: "lock", lock_open: "lock-open", lock_clock: "lock-clock", logout: "logout",
    security: "shield", shield: "shield", verified_user: "shield-check",
    admin_panel_settings: "shield-account", security_update_warning: "shield-alert",
    vpn_key: "key", fingerprint: "fingerprint",

    // Settings / misc
    settings: "cog", settings_suggest: "cog-refresh", settings_input_component: "tune",
    filter_list: "filter-variant", translate: "translate", stars: "star-circle",
    star: "star", code: "code-tags", layers: "layers", payments: "cash-multiple",
    account_balance_wallet: "wallet",

    // Text formatting
    format_bold: "format-bold", format_italic: "format-italic",
    format_underlined: "format-underline", format_list_bulleted: "format-list-bulleted",
    format_list_numbered: "format-list-numbered",

    // Added after a sweep for names that would have silently rendered as a fallback dot.
    check_box: "checkbox-marked", check_box_outline_blank: "checkbox-blank-outline",
    circle: "circle", cloud_upload: "cloud-upload", contact_phone: "card-account-phone",
    delete_forever: "delete-forever", file_present: "file", help_outline: "help-circle-outline",
    question_mark: "help", save: "content-save",

    // Config-driven names. These live in the nav definition and module configs as
    // `icon: "groups"`, never as a literal in JSX, so a sweep of the markup alone missed them —
    // and these are the sidebar glyphs, the most visible icons in the product.
    "360": "rotate-360", add_business: "store-plus", assignment_ind: "account-details",
    business_center: "briefcase", category: "shape", checklist: "format-list-checks",
    co_present: "presentation", conversion_path: "sitemap", dashboard: "view-dashboard",
    dns: "dns", draft: "file-outline", extension: "puzzle", flag: "flag",
    folder_zip: "folder-zip", forward_to_inbox: "email-fast", grid_view: "view-grid",
    groups: "account-group", health_and_safety: "shield-plus", home_work: "home-city",
    hourglass_bottom: "timer-sand", hourglass_top: "timer-sand", hub: "sitemap",
    image: "image", lan: "lan", money_off: "cash-off", picture_as_pdf: "file-pdf-box",
    public: "earth", radio_button_checked: "radiobox-marked", receipt: "receipt",
    savings: "piggy-bank", settings_applications: "cog-box", share_location: "map-marker-radius",
    slideshow: "presentation-play", smart_display: "play-box",
    space_dashboard: "view-dashboard-variant", star_rate: "star", sticky_note_2: "note",
    table: "table", tag: "tag", timer: "timer", tune: "tune", videocam: "video",
    waving_hand: "hand-wave", work_history: "briefcase-clock", workspaces: "view-grid-plus",

    // Passed as a JSX prop (`<Button icon="create_new_folder">`) rather than as config or a
    // literal in an Icon element, which is why two earlier sweeps missed them — and why every
    // "New folder" button was showing the fallback dot instead of a folder.
    create_new_folder: "folder-plus", add_moderator: "shield-account", group_add: "account-multiple-plus",
    trending_down: "trending-down", event_note: "calendar-text", library_add: "playlist-plus",
    input: "import", manage_search: "text-search", contact_mail: "card-account-mail",
    grading: "clipboard-check-outline", leaderboard: "podium", reviews: "comment-quote",
    filter_alt_off: "filter-off", target: "target",

    // Places
    location_on: "map-marker", push_pin: "pin",
};

/** lucide-react component name → MDI. */
export const LUCIDE_TO_MDI: Record<string, string> = {
    Search: "magnify", SearchCode: "text-search", X: "close", XCircle: "close-circle",
    ChevronDown: "chevron-down", ChevronUp: "chevron-up", ChevronRight: "chevron-right",
    ChevronLeft: "chevron-left", ArrowRight: "arrow-right", ArrowLeft: "arrow-left",
    ArrowUpRight: "arrow-top-right", Plus: "plus", PlusCircle: "plus-circle", Minus: "minus",
    Trash2: "delete", Filter: "filter-variant", SlidersHorizontal: "tune", Settings2: "tune",
    Settings: "cog", CheckCircle2: "check-circle", CircleCheck: "check-circle", Check: "check",
    CheckSquare: "checkbox-marked-outline", Square: "square-outline", Circle: "circle-outline",
    Sparkles: "auto-fix", Wand2: "auto-fix", Zap: "lightning-bolt", Clock: "clock-outline",
    Timer: "timer", CalendarClock: "calendar-clock", CalendarRange: "calendar-range",
    Calendar: "calendar", RefreshCcw: "refresh", RefreshCw: "refresh", RotateCcw: "rotate-left",
    Undo2: "undo", Redo2: "redo", Mail: "email", AtSign: "at", Send: "send", Reply: "reply",
    Inbox: "inbox", Briefcase: "briefcase", Users: "account-group", User: "account",
    UserCheck: "account-check", UserPlus: "account-plus", UserX: "account-remove",
    UserCog: "account-cog", UserCircle: "account-circle", AlertCircle: "alert-circle",
    AlertTriangle: "alert", Info: "information", HelpCircle: "help-circle",
    Activity: "pulse", HeartPulse: "heart-pulse", Loader2: "loading", MapPin: "map-marker",
    Pin: "pin", FileText: "file-document-outline", FileEdit: "file-document-edit",
    ClipboardList: "clipboard-list", ListChecks: "format-list-checks",
    List: "format-list-bulleted", ListOrdered: "format-list-numbered", ListPlus: "playlist-plus",
    Globe: "earth", Save: "content-save", ExternalLink: "open-in-new", Link: "link-variant",
    Link2: "link-variant", Unplug: "power-plug-off", Eye: "eye", EyeOff: "eye-off",
    Brain: "brain", BrainCircuit: "brain", Building: "office-building",
    Building2: "office-building", Landmark: "bank", Shield: "shield",
    ShieldCheck: "shield-check", ShieldAlert: "shield-alert", ShieldHalf: "shield-half-full",
    ShieldPlus: "shield-plus", Lock: "lock", KeyRound: "key", Phone: "phone",
    ThumbsUp: "thumb-up", Play: "play", Pause: "pause", Layout: "view-dashboard",
    LayoutDashboard: "view-dashboard", LayoutGrid: "view-grid",
    LayoutTemplate: "view-dashboard-variant", BarChart: "chart-bar", BarChart3: "chart-bar",
    TrendingUp: "trending-up", Table2: "table", Radar: "radar", Edit: "pencil",
    Edit2: "pencil", Edit3: "pencil", Pencil: "pencil", Video: "video", VideoOff: "video-off",
    Camera: "camera", Image: "image", Monitor: "monitor", Layers: "layers",
    MoreHorizontal: "dots-horizontal", MoreVertical: "dots-vertical",
    GripVertical: "drag-vertical", History: "history", Github: "github", Linkedin: "linkedin",
    Twitter: "twitter", Facebook: "facebook", Youtube: "youtube", Instagram: "instagram",
    Rss: "rss", DollarSign: "currency-usd", PiggyBank: "piggy-bank", Wallet: "wallet",
    Calculator: "calculator", FolderOpen: "folder-open", FolderKanban: "folder-multiple",
    Archive: "archive", Bookmark: "bookmark", MessageSquare: "message-text",
    MessagesSquare: "forum", MessageSquareQuote: "comment-quote", Megaphone: "bullhorn",
    Network: "lan", Code: "code-tags", Code2: "code-tags", Terminal: "console", Cpu: "chip",
    Atom: "atom", Bot: "robot", Mic: "microphone", Mic2: "microphone-variant",
    MicOff: "microphone-off", DraftingCompass: "compass-outline", Star: "star",
    Award: "medal", Trophy: "trophy", Gift: "gift", Paintbrush: "brush",
    BookOpen: "book-open-variant", Wrench: "wrench", Target: "target",
    Share: "share-variant", Upload: "upload", Copy: "content-copy", Badge: "badge-account",
    Lightbulb: "lightbulb", Rocket: "rocket", Bold: "format-bold", Italic: "format-italic",
    Underline: "format-underline", LogIn: "login",
};

/** A name with no mapping renders this, so a gap is visible in review rather than blank. */
export const MDI_FALLBACK = "circle-small";

export function mdiFor(name: string | undefined | null): string {
    if (!name) return MDI_FALLBACK;
    if (MATERIAL_TO_MDI[name]) return MATERIAL_TO_MDI[name];
    if (LUCIDE_TO_MDI[name]) return LUCIDE_TO_MDI[name];
    // Anything left is assumed to be an MDI name already, and passes through. The lucide shim
    // resolves through this map before calling Icon, so it arrives holding MDI names like
    // "earth" or "close" — single words that are neither map KEYS nor dashed. Treating only
    // dashed names as MDI sent every one of those to the fallback dot, which is how the
    // language switcher lost its globe.
    //
    // Material names are the ones that must not pass through silently, and they are
    // identifiable: they use underscores. An unmapped one still falls back, visibly.
    if (name.includes("_")) return MDI_FALLBACK;
    return name;
}
