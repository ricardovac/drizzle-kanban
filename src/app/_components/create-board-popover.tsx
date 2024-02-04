"use client"

import React, { useState } from "react"
import Image from "next/image"
import { BackgroundTypeSchema, createBoard } from "@/server/schema/board.schema"
import { api } from "@/trpc/react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "components/ui/button"
import { ColorPicker } from "components/ui/color-picker"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form"
import { Input } from "components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "components/ui/popover"
import { cn, generateRandomHex } from "lib/utils"
import { LoaderIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { useAuthContext } from "@/context/auth-context"

interface CreateBoardPopoverProps {
  children: React.ReactNode
  className?: string
  variant?:
    | "default"
    | "secondary"
    | "link"
    | "destructive"
    | "outline"
    | "ghost"
    | null
    | undefined
}

export default function CreateBoardPopover({
  children,
  variant,
  className
}: CreateBoardPopoverProps) {
  const { user } = useAuthContext()
  const [backgroundColor, setBackgroundColor] = useState("")

  const form = useForm<z.infer<typeof createBoard>>({
    resolver: zodResolver(createBoard),
    mode: "onSubmit",
    defaultValues: {
      title: "",
      ownerId: "",
      background: { type: "color", value: generateRandomHex() },
      public: true
    }
  })
  const utils = api.useUtils()
  const { mutate, isLoading } = api.board.create.useMutation({
    onSuccess: async () => {
      form.reset()
      await utils.board.all.invalidate({ limit: 10 })
    }
  })

  const watchedBackground = form.watch("background")

  const isSubmitButtonDisabled = !form.getValues("title")

  const onSubmit = (values: z.infer<typeof createBoard>) => {
    mutate({
      ...values,
      ownerId: user.id
    })
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className={cn(className)} variant={variant}>
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="relative flex flex-col justify-center gap-6">
          <h1>Criar quadro</h1>

          <BoardPreview watchedBackground={watchedBackground} />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="background"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Tela de fundo</FormLabel>
                    <FormControl>
                      <ColorPicker
                        {...field}
                        setBackground={setBackgroundColor}
                        background={backgroundColor}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Insira o título do quadro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-10 w-full" disabled={isSubmitButtonDisabled} type="submit">
                {isLoading && <LoaderIcon className="mr-2 size-4 animate-spin" />}
                Criar
              </Button>
            </form>
          </Form>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface BoardPreviewProps {
  watchedBackground: BackgroundTypeSchema
}

function BoardPreview({ watchedBackground }: BoardPreviewProps) {
  return (
    <div className="flex justify-center p-6" style={{ backgroundColor: watchedBackground.value }}>
      <Image src="/assets/board.svg" alt="Board SVG" width={160} height={90} />
    </div>
  )
}
