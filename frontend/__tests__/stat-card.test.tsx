import { render, screen } from '@testing-library/react'
import { StatCard } from '@/components/admin/stat-card'
import { Users } from 'lucide-react'

// Mock framer-motion to avoid issues with animations in tests
jest.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}))

// Mock AnimatedCounter
jest.mock('@/components/animations/animated-counter', () => ({
    AnimatedCounter: ({ value }: { value: number }) => <span>{value}</span>,
}))

describe('StatCard', () => {
    it('renders title and value correctly', () => {
        render(
            <StatCard
                title="Total Users"
                value={1234}
                icon={Users}
            />
        )

        expect(screen.getByText('Total Users')).toBeInTheDocument()
        expect(screen.getByText('1234')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
        render(
            <StatCard
                title="Total Users"
                value={1234}
                description="Active users this month"
                icon={Users}
            />
        )

        expect(screen.getByText('Active users this month')).toBeInTheDocument()
    })

    it('renders trend when provided', () => {
        render(
            <StatCard
                title="Total Users"
                value={1234}
                icon={Users}
                trend={{ value: 12, isPositive: true }}
            />
        )

        expect(screen.getByText('↑')).toBeInTheDocument()
        expect(screen.getByText('12%')).toBeInTheDocument()
        expect(screen.getByText('from last month')).toBeInTheDocument()
    })
})
