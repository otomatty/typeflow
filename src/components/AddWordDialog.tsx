import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from '@phosphor-icons/react'
import { toRomaji, toHiragana } from '@/lib/romaji-utils'
import { Word } from '@/lib/types'

interface AddWordDialogProps {
  onAddWord: (word: Omit<Word, 'id' | 'stats'>) => void
}

export function AddWordDialog({ onAddWord }: AddWordDialogProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [reading, setReading] = useState('')
  const [romaji, setRomaji] = useState('')

  const handleTextChange = (value: string) => {
    setText(value)
    const hiragana = toHiragana(value)
    setReading(hiragana)
    setRomaji(toRomaji(hiragana))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) return

    onAddWord({
      text: text.trim(),
      reading: reading.trim() || text.trim(),
      romaji: romaji.trim() || text.trim().toLowerCase(),
    })

    setText('')
    setReading('')
    setRomaji('')
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus weight="bold" />
          <span className="hidden sm:inline">Add Word</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Word</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Word / Text</Label>
            <Input
              id="text"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="例: Promise.all, 非同期処理"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reading">Reading (Hiragana)</Label>
            <Input
              id="reading"
              value={reading}
              onChange={(e) => {
                setReading(e.target.value)
                setRomaji(toRomaji(e.target.value))
              }}
              placeholder="Auto-generated"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="romaji">Romaji (for typing)</Label>
            <Input
              id="romaji"
              value={romaji}
              onChange={(e) => setRomaji(e.target.value)}
              placeholder="Auto-generated"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
