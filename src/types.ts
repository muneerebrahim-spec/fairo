export interface Person {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  paidById: string
  splitAmongIds: string[]
}

export interface Balance {
  personId: string
  personName: string
  net: number
}

export interface Settlement {
  fromId: string
  fromName: string
  toId: string
  toName: string
  amount: number
}
