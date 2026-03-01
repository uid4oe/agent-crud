import {
	FileText,
	ListTodo,
	Loader2,
	Menu,
	MessageSquare,
	Pencil,
	Plus,
	Search,
	Target,
	Trash2,
	X,
} from "lucide-react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import { ROUTES } from "../../config";
import { useIsMobile } from "../../hooks/useIsMobile";
import { trpc } from "../../lib/trpc";
import { cn } from "../../lib/utils";

export const Sidebar = memo(function Sidebar() {
	const isMobile = useIsMobile();
	const navigate = useNavigate();
	const { conversationId } = useParams();
	const location = useLocation();
	const utils = trpc.useUtils();

	const [isExpanded, setIsExpanded] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [renamingId, setRenamingId] = useState<string | null>(null);
	const [renameValue, setRenameValue] = useState("");
	const renameInputRef = useRef<HTMLInputElement>(null);

	const { data: conversations } = trpc.agent.listConversations.useQuery();

	const deleteConversation = trpc.agent.deleteConversation.useMutation({
		onSuccess: (_, deletedVariables) => {
			utils.agent.listConversations.invalidate();
			if (conversationId === deletedVariables.id) {
				navigate(ROUTES.CHAT);
			}
		},
	});

	const renameConversation = trpc.agent.updateConversationTitle.useMutation({
		onSuccess: () => {
			utils.agent.listConversations.invalidate();
			setRenamingId(null);
		},
	});

	const closeMobileDrawer = useCallback(() => {
		if (isMobile) setMobileOpen(false);
	}, [isMobile]);

	// Focus rename input when entering rename mode
	useEffect(() => {
		if (renamingId) {
			setTimeout(() => renameInputRef.current?.focus(), 50);
		}
	}, [renamingId]);

	const handleNewChat = () => {
		navigate(ROUTES.CHAT);
		closeMobileDrawer();
	};

	const handleDelete = (e: React.MouseEvent, id: string) => {
		e.stopPropagation();
		deleteConversation.mutate({ id });
	};

	const handleStartRename = (
		e: React.MouseEvent,
		id: string,
		currentTitle: string,
	) => {
		e.stopPropagation();
		setRenamingId(id);
		setRenameValue(currentTitle || "");
	};

	const handleRenameSubmit = (id: string) => {
		const trimmed = renameValue.trim();
		if (trimmed) {
			renameConversation.mutate({ id, title: trimmed });
		} else {
			setRenamingId(null);
		}
	};

	const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleRenameSubmit(id);
		} else if (e.key === "Escape") {
			setRenamingId(null);
		}
	};

	const handleConversationClick = useCallback(
		(id: string) => {
			navigate(`${ROUTES.CHAT}/${id}`);
			closeMobileDrawer();
		},
		[navigate, closeMobileDrawer],
	);

	const expanded = isMobile ? true : isExpanded;

	// Filter conversations by search
	const filteredConversations = useMemo(
		() =>
			conversations?.filter((conv) => {
				if (!searchQuery) return true;
				const q = searchQuery.toLowerCase();
				return (conv.title || "").toLowerCase().includes(q);
			}),
		[conversations, searchQuery],
	);

	const sidebarContent = (
		<div
			className={cn(
				"flex flex-col bg-surface h-full",
				isMobile ? "w-72" : "transition-all duration-300 ease-in-out",
				!isMobile && (isExpanded ? "w-64" : "w-[68px]"),
			)}
		>
			<div className="flex flex-col flex-1 overflow-hidden p-3 gap-4">
				<div className={cn("flex items-center", !expanded && "justify-center")}>
					{isMobile ? (
						<div className="flex items-center justify-between w-full px-1">
							<span className="font-semibold text-sm text-gray-800">
								TaskAI
							</span>
							<button
								type="button"
								onClick={() => setMobileOpen(false)}
								className="p-2 rounded-full hover:bg-black/5 transition-all duration-150 active:scale-90"
							>
								<X className="h-5 w-5 text-gray-600" />
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setIsExpanded(!isExpanded)}
							className="p-2.5 rounded-full hover:bg-black/5 transition-all duration-150 active:scale-90 flex items-center justify-center shrink-0"
						>
							<Menu className="h-5 w-5 text-gray-700" />
						</button>
					)}
				</div>

				<button
					type="button"
					onClick={handleNewChat}
					className={cn(
						"flex items-center gap-3 bg-purple text-purple-foreground hover:bg-purple-hover transition-all duration-200 active:scale-[0.97] shadow-sm shrink-0 overflow-hidden",
						expanded
							? "px-4 py-3 rounded-2xl"
							: "w-[44px] h-[44px] justify-center mx-auto rounded-xl",
					)}
				>
					<Plus className="h-5 w-5 shrink-0" />
					{expanded && (
						<span className="font-medium text-sm whitespace-nowrap">
							New chat
						</span>
					)}
				</button>

				{/* Search conversations */}
				{expanded && conversations && conversations.length > 3 && (
					<div className="relative px-1">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search chats..."
							className="w-full pl-8 pr-3 py-1.5 text-xs bg-white/60 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple placeholder:text-gray-400 transition-all duration-200 focus:bg-white"
						/>
					</div>
				)}

				<div className="flex-1 overflow-y-auto scrollbar-hide">
					{expanded &&
						filteredConversations &&
						filteredConversations.length > 0 && (
							<div className="mb-2 px-1">
								<span className="text-[13px] font-medium text-gray-500">
									Recent
								</span>
							</div>
						)}
					{expanded &&
						(!filteredConversations || filteredConversations.length === 0) && (
							<div className="flex flex-col items-center justify-center py-8 px-3 text-center">
								<MessageSquare className="h-8 w-8 text-gray-300 mb-2" />
								<p className="text-xs text-gray-400 leading-relaxed">
									{searchQuery
										? "No matching conversations"
										: "No conversations yet"}
								</p>
							</div>
						)}
					<div className="space-y-0.5">
						{filteredConversations?.map((conv) => {
							const isActive = conversationId === conv.id;
							const isDeleting =
								deleteConversation.variables?.id === conv.id &&
								deleteConversation.isPending;
							const isRenaming = renamingId === conv.id;

							return (
								<div key={conv.id} className="relative group">
									<button
										type="button"
										onClick={() =>
											!isRenaming && handleConversationClick(conv.id)
										}
										className={cn(
											"flex items-center gap-3 py-2 rounded-full transition-all duration-150 shrink-0 w-full",
											expanded
												? "px-3"
												: "w-10 h-10 px-0 justify-center mx-auto",
											isActive
												? "bg-sidebar-active text-sidebar-active-foreground"
												: "hover:bg-black/5 text-gray-700",
										)}
										title={!expanded ? conv.title || "Chat" : undefined}
									>
										<MessageSquare className="h-4 w-4 shrink-0" />
										{expanded &&
											(isRenaming ? (
												<input
													ref={renameInputRef}
													value={renameValue}
													onChange={(e) => setRenameValue(e.target.value)}
													onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
													onBlur={() => handleRenameSubmit(conv.id)}
													onClick={(e) => e.stopPropagation()}
													className="text-sm flex-1 bg-transparent border-b border-gray-400 focus:border-purple outline-none py-0 px-0"
												/>
											) : (
												<span
													className="text-sm truncate pr-14 text-left flex-1"
													dir="auto"
												>
													{conv.title || "New Chat"}
												</span>
											))}
									</button>

									{expanded && !isRenaming && (
										<div
											className={cn(
												"absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200",
												isMobile
													? "opacity-100"
													: "opacity-0 group-hover:opacity-100",
											)}
										>
											<button
												type="button"
												onClick={(e) =>
													handleStartRename(e, conv.id, conv.title || "")
												}
												className="p-1.5 hover:bg-black/10 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none transition-all duration-150"
												title="Rename chat"
												aria-label="Rename chat"
											>
												<Pencil className="h-3 w-3" />
											</button>
											<button
												type="button"
												onClick={(e) => handleDelete(e, conv.id)}
												disabled={isDeleting}
												className="p-1.5 hover:bg-black/10 rounded-full text-gray-500 hover:text-red-500 focus:outline-none transition-all duration-150"
												title="Delete chat"
												aria-label="Delete chat"
											>
												{isDeleting ? (
													<Loader2 className="h-3.5 w-3.5 animate-spin text-red-500" />
												) : (
													<Trash2 className="h-3.5 w-3.5" />
												)}
											</button>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<div className="p-3">
				<div className="space-y-0.5">
					<NavLink
						to={ROUTES.TASKS}
						onClick={closeMobileDrawer}
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 py-2 rounded-full transition-all duration-150 shrink-0",
								expanded
									? "w-full px-3"
									: "w-10 h-10 px-0 justify-center mx-auto",
								isActive || location.pathname.startsWith(ROUTES.TASKS)
									? "bg-sidebar-active text-sidebar-active-foreground"
									: "hover:bg-black/5 text-gray-700",
							)
						}
						title={!expanded ? "Tasks" : undefined}
					>
						<ListTodo className="h-5 w-5 shrink-0" />
						{expanded && <span className="text-sm font-medium">Tasks</span>}
					</NavLink>
					<NavLink
						to={ROUTES.NOTES}
						onClick={closeMobileDrawer}
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 py-2 rounded-full transition-all duration-150 shrink-0",
								expanded
									? "w-full px-3"
									: "w-10 h-10 px-0 justify-center mx-auto",
								isActive || location.pathname.startsWith(ROUTES.NOTES)
									? "bg-sidebar-active text-sidebar-active-foreground"
									: "hover:bg-black/5 text-gray-700",
							)
						}
						title={!expanded ? "Notes" : undefined}
					>
						<FileText className="h-5 w-5 shrink-0" />
						{expanded && <span className="text-sm font-medium">Notes</span>}
					</NavLink>
					<NavLink
						to={ROUTES.WELLNESS}
						onClick={closeMobileDrawer}
						className={({ isActive }) =>
							cn(
								"flex items-center gap-3 py-2 rounded-full transition-all duration-150 shrink-0",
								expanded
									? "w-full px-3"
									: "w-10 h-10 px-0 justify-center mx-auto",
								isActive || location.pathname.startsWith(ROUTES.WELLNESS)
									? "bg-sidebar-active text-sidebar-active-foreground"
									: "hover:bg-black/5 text-gray-700",
							)
						}
						title={!expanded ? "Wellness" : undefined}
					>
						<Target className="h-5 w-5 shrink-0" />
						{expanded && <span className="text-sm font-medium">Wellness</span>}
					</NavLink>
				</div>
			</div>
		</div>
	);

	// Mobile: overlay drawer
	if (isMobile) {
		return (
			<>
				{/* Mobile hamburger trigger */}
				<button
					type="button"
					onClick={() => setMobileOpen(true)}
					className="fixed top-3 left-3 z-40 p-2.5 rounded-full bg-white shadow-md hover:bg-gray-50 transition-all duration-200 active:scale-90 md:hidden"
					aria-label="Open menu"
				>
					<Menu className="h-5 w-5 text-gray-700" />
				</button>

				{/* Overlay */}
				{mobileOpen && (
					<button
						type="button"
						className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] transition-opacity md:hidden"
						onClick={() => setMobileOpen(false)}
						aria-label="Close menu"
					/>
				)}

				{/* Drawer */}
				<div
					className={cn(
						"fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:hidden",
						mobileOpen ? "translate-x-0" : "-translate-x-full",
					)}
				>
					{sidebarContent}
				</div>
			</>
		);
	}

	// Desktop: static sidebar
	return sidebarContent;
});
