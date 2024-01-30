import { FC } from "react"
import { type InfiniteBoard } from "@/trpc/shared"
import { loadingArray } from "@/utils/loadingArray"
import { Skeleton } from "components/ui/skeleton"

import BoardCard from "./board-card"
import CreateBoardPopover from "./create-board-popover"

interface BoardListProps {
  boards?: InfiniteBoard[]
  showCreateBoardButton?: boolean
  loading?: boolean
}

const BoardList: FC<BoardListProps> = ({ boards = [], showCreateBoardButton = false, loading }) => {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {boards && boards.map((board) => <BoardCard key={board.id} board={board} />)}

      {loading && loadingArray(3).map((_, i) => <Skeleton className="h-24" key={i} />)}

      {showCreateBoardButton && (
        <CreateBoardPopover className="min-h-[100px] min-w-[200px] text-white" variant="secondary">
          Criar novo quadro
        </CreateBoardPopover>
      )}
    </div>
  )
}

export default BoardList
