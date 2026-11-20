import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Avatar, Button, Input, Menu, Pagination, ProgressBar, Tabs } from '.'

describe('ui kit', () => {
  it('Button fires onClick and blocks while loading', async () => {
    const onClick = vi.fn()
    const { rerender } = render(<Button onClick={onClick}>Save</Button>)
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    rerender(<Button loading onClick={onClick}>Save</Button>)
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('Input links label, error and aria-invalid', () => {
    render(<Input label="Email" error="Enter a valid email" />)
    const el = screen.getByLabelText('Email')
    expect(el).toHaveAttribute('aria-invalid', 'true')
    expect(el).toHaveAccessibleDescription('Enter a valid email')
  })

  it('Avatar shows initials', () => {
    render(<Avatar name="Aigerim Nurlan" />)
    expect(screen.getByRole('img', { name: 'Aigerim Nurlan' })).toHaveTextContent('AN')
  })

  it('ProgressBar clamps value', () => {
    render(<ProgressBar value={140} label="Goal" />)
    expect(screen.getByRole('progressbar', { name: 'Goal' })).toHaveAttribute('aria-valuenow', '100')
  })

  it('Tabs move with arrow keys', async () => {
    const onChange = vi.fn()
    render(<Tabs label="Group" value="a" onChange={onChange} items={[{ id: 'a', label: 'Chat', content: 'A' }, { id: 'b', label: 'Goals', content: 'B' }]} />)
    screen.getByRole('tab', { name: 'Chat' }).focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('Menu opens, selects and closes', async () => {
    const onSelect = vi.fn()
    render(<Menu label="Actions" trigger="Open" items={[{ id: 'x', label: 'Edit', onSelect }]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Edit' }))
    expect(onSelect).toHaveBeenCalled()
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('Pagination disables edges and localises text', () => {
    render(<Pagination page={1} total={3} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument()
  })
})
