const sortedListsAreEqual = <T>(a: T[], b: T[]): boolean => {    
    if (a.length !== b.length) return false
    return a.every((value, index) => value === b[index])
}

export default sortedListsAreEqual
