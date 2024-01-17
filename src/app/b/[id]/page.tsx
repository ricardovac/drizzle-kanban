import { Flex } from '@mantine/core';
import { Suspense } from 'react';
import BoardAppShell from '~/app/_components/board-appshell';
import CreateCardForm from '~/app/_components/create-card-form';
import CreateListForm from '~/app/_components/create-list-form';
import { api } from '~/trpc/server';

interface BoardPageProps {
  params: { id: string };
}

export default async function Page({ params }: BoardPageProps) {
  const id = params.id;
  const board = await api.board.get.query({ id });
  const initialLists = await api.list.all.query({
    boardId: id,
  });

  return (
    <BoardAppShell board={board}>
      <Suspense fallback={<p>Loading...</p>}>
        <Flex gap={8} align="flex-start">
          <CreateCardForm initialLists={initialLists} boardId={id} />
          <CreateListForm boardId={id} />
        </Flex>
      </Suspense>
    </BoardAppShell>
  );
}
