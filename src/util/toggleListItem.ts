
const toggleListItem = (selections: string[], item: string) => {
    if (selections.includes(item)) return selections.filter(a => a !== item)
    return [...selections, item]
}

export default toggleListItem