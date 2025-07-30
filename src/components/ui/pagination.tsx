// import * as React from "react"
// import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
//
// import { cn } from "@/lib/utils"
// import { ButtonProps, buttonVariants } from "@/components/ui/button"
//
// const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
//   <nav
//     role="navigation"
//     aria-label="pagination"
//     className={cn("mx-auto flex w-full justify-center", className)}
//     {...props}
//   />
// )
// Pagination.displayName = "Pagination"
//
// const PaginationContent = React.forwardRef<
//   HTMLUListElement,
//   React.ComponentProps<"ul">
// >(({ className, ...props }, ref) => (
//   <ul
//     ref={ref}
//     className={cn("flex flex-row items-center gap-1", className)}
//     {...props}
//   />
// ))
// PaginationContent.displayName = "PaginationContent"
//
// const PaginationItem = React.forwardRef<
//   HTMLLIElement,
//   React.ComponentProps<"li">
// >(({ className, ...props }, ref) => (
//   <li ref={ref} className={cn("", className)} {...props} />
// ))
// PaginationItem.displayName = "PaginationItem"
//
// type PaginationLinkProps = {
//   isActive?: boolean
// } & Pick<ButtonProps, "size"> &
//   React.ComponentProps<"a">
//
// const PaginationLink = ({
//   className,
//   isActive,
//   size = "icon",
//   ...props
// }: PaginationLinkProps) => (
//   <a
//     aria-current={isActive ? "page" : undefined}
//     className={cn(
//       buttonVariants({
//         variant: isActive ? "outline" : "ghost",
//         size,
//       }),
//       className
//     )}
//     {...props}
//   />
// )
// PaginationLink.displayName = "PaginationLink"
//
// const PaginationPrevious = ({
//   className,
//   ...props
// }: React.ComponentProps<typeof PaginationLink>) => (
//   <PaginationLink
//     aria-label="Go to previous page"
//     size="default"
//     className={cn("gap-1 pl-2.5", className)}
//     {...props}
//   >
//     <ChevronLeft className="h-4 w-4" />
//     <span>Previous</span>
//   </PaginationLink>
// )
// PaginationPrevious.displayName = "PaginationPrevious"
//
// const PaginationNext = ({
//   className,
//   ...props
// }: React.ComponentProps<typeof PaginationLink>) => (
//   <PaginationLink
//     aria-label="Go to next page"
//     size="default"
//     className={cn("gap-1 pr-2.5", className)}
//     {...props}
//   >
//     <span>Next</span>
//     <ChevronRight className="h-4 w-4" />
//   </PaginationLink>
// )
// PaginationNext.displayName = "PaginationNext"
//
// const PaginationEllipsis = ({
//   className,
//   ...props
// }: React.ComponentProps<"span">) => (
//   <span
//     aria-hidden
//     className={cn("flex h-9 w-9 items-center justify-center", className)}
//     {...props}
//   >
//     <MoreHorizontal className="h-4 w-4" />
//     <span className="sr-only">More pages</span>
//   </span>
// )
// PaginationEllipsis.displayName = "PaginationEllipsis"
//
// export {
//   Pagination,
//   PaginationContent,
//   PaginationEllipsis,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// }

import BackIcon from "../assets/icons/BackIcon.tsx";
import React, { useMemo } from "react";
import { cn } from "../utils/common.ts";

export default function Pagination({
  count,
  page,
  setPage,
}: {
  count: number;
  page: number;
  setPage: (page: number) => void;
}) {
  const totalPages = useMemo(() => Math.ceil(count / 10), [count]);
  const previousPageDisabled = useMemo(() => page === 1, [page]);
  const nextPageDisabled = useMemo(
    () => (totalPages > 0 ? page === totalPages : true),
    [page, totalPages],
  );

  const handlePrevious = () => {
    if (!previousPageDisabled) {
      setPage(page - 1);
    }
  };

  const handleNext = () => {
    if (!nextPageDisabled) {
      setPage(page + 1);
    }
  };

  return (
    // <div
    //   className={
    //     'bg-[#FFFFFF1A] border-[0.5px] border-[#FFFFFF12] rounded-full p-[4px] w-fit justify-self-center flex items-center gap-[5px] self-center'
    //   }>
    //   <div
    //     className={cn(
    //       'h-[34px] w-[34px] rounded-full bg-[#FFFFFF1A] flex justify-center items-center',
    //       previousPageDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    //     )}
    //     onClick={handlePrevious}>
    //     <BackIcon className={previousPageDisabled ? '' : 'hover:text-orange-400'} />
    //   </div>
    //
    //   <div className={'h-[38px] w-[38px] flex justify-center items-center font-medium'}>
    //     {page}
    //   </div>
    //
    //   <div
    //     className={cn(
    //       'h-[34px] w-[34px] rounded-full bg-[#FFFFFF1A] flex justify-center items-center rotate-180',
    //       nextPageDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
    //     )}
    //     onClick={handleNext}>
    //     <BackIcon className={nextPageDisabled ? '' : 'hover:text-orange-400'} />
    //   </div>
    // </div>

    totalPages > 1 && (
      <div className="w-full flex justify-end items-center gap-[15px] py-[10px]">
        <button
          onClick={handlePrevious}
          disabled={previousPageDisabled}
          className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7.5 9L4.5 6L7.5 3"
              stroke="#2C2A2A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-[8px]">
          <span className="text-[12px] text-gray-500">
            {page} of {totalPages}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={nextPageDisabled}
          className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M4.5 3L7.5 6L4.5 9"
              stroke="#2C2A2A"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    )
  );
}
