import type { ReactNode } from "react";
import { PageError } from "../feedback";

const SKELETON_KEYS = ["sk-a", "sk-b", "sk-c", "sk-d", "sk-e"];

interface ResourcePageLayoutProps {
	isLoading: boolean;
	error: { message: string } | null;
	resourceName: string;
	skeletonColumns?: number;
	children: ReactNode;
}

export function ResourcePageLayout({
	isLoading,
	error,
	resourceName,
	skeletonColumns = 3,
	children,
}: ResourcePageLayoutProps) {
	if (isLoading) {
		const gridClasses =
			skeletonColumns > 3
				? "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
				: "grid grid-cols-1 md:grid-cols-3 gap-6";

		return (
			<div className="space-y-6 p-6 md:p-8 mx-auto w-full">
				<div className="flex items-center justify-between pb-2 px-2">
					<div>
						<div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
						<div className="h-4 w-20 bg-gray-100 rounded mt-2 animate-pulse" />
					</div>
					<div className="h-11 w-32 bg-gray-100 rounded-full animate-pulse" />
				</div>
				<div className={gridClasses}>
					{SKELETON_KEYS.slice(0, skeletonColumns).map((key) => (
						<div key={key} className="rounded-2xl bg-gray-50 p-3 min-h-[200px]">
							<div className="h-4 w-16 bg-gray-100 rounded animate-pulse mb-3" />
							<div className="rounded-2xl border border-gray-100 p-5 space-y-3">
								<div className="h-8 w-8 bg-gray-100 rounded-xl animate-pulse" />
								<div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
								<div className="h-3 w-full bg-gray-50 rounded animate-pulse" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (error) {
		return <PageError resourceName={resourceName} message={error.message} />;
	}

	return (
		<div className="space-y-6 h-full overflow-y-auto p-6 pt-14 md:pt-8 md:p-8 mx-auto w-full">
			{children}
		</div>
	);
}
