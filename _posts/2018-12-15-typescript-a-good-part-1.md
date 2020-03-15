---
layout: post
title:  "TypeScript: A Good Part - Part 1 of 4"
---
## Introduction

TypeScript has emerged as a leading alternative to JavaScript in large projects where compiler-enforced type-constraints[^1] free developers from runtime uncertainty.

When approaching a new language, many developers think in terms of other languages they know and stick to familiar paradigms. While perfectly natural, it risks missing innovative features. The situation in a multiparadigm language is worse, where a developer can ignore half of the features and get along perfectly well in ignorant bliss. TypeScript is such  a language.

This is the story of a journey into TypeScript and the haphazard discoveries made along the way. It is about two developers escaping their mental confines and becoming better, together.

## Patrick and Me

I am an anxious woodland creature who prefers the security of his burrow. Nestled in bubble wrap and sipping weak tea, I like to write Scala and contemplate why my hair sticks up on that one side, while waiting for the compiler to finish its noble work.

Patrick skydives in a wing suit and surfs Hawaiian lava flows. He loves JavaScript. Wresting with npm dependencies brings back fond memories of living off the grid and grappling grizzly bears in Tuktoyaktuk.

Our current project involves TypeScript.

## Motivating Example

Consider a project with many domain objects, each with screens for perusing collections of such objects: a paginated table of records, sortable and searchable by any field. A table of person records, for example:

### People

Search:

|First Name|LastName|Age|Address|Country|
|---|---|---|---|---|
|Sirmal|Ningh|21|22 23rd Street|India|
|Waniel|Den|23|28 South Street North|China|
|Paleb|Cowell|12|58 Northwest Street East|Ireland|

This kind of interface appears at least 50 times in our application. While it's tempting to componentize it, there are subtle differences between screens that complicate matters. We chose to hold off on componentization and replicate the UI logic until we had a better picture of what the moving parts were. The plus side is there was ample opportunity to experiment with different ideas. 

This series is a walk-through of a few iterations and the small improvements made along the way, eventually culminating in an API that is more beautiful than we ever knew possible.

## Free Text Search

#### Requirement
A table can be filtered to only show rows that match a search query, where a query is defined as one or more space-delimited tokens. A row matches a query when all tokens are found in the row. For example:

Search: **ir al**  

Matches **ir** and **al** in S**ir**m**al**. It also matches **al** in P**al**eb, and **Ir** in **Ir**eland:

|First Name|LastName|Age|Address|Country|
|---|---|---|---|---|
|S**ir**m**al**|Ningh|21|22 23rd Street|India|
|P**al**eb|Cowell|12|58 Northwest Street East|**Ir**eland|

#### API[^2]

We start with some basic definitions to help compare fields belonging to objects of different types.

```typescript
type Predicate<T> = (t: T) => boolean;

/**
 * Maps an object to an array of searchable field values. 
 */
type FieldExtractor<T> = (t: T) => string[];  

/**
 * Rejects null or undefined values (an issue if there is a lackadaisical 
 * tsconfig.json)
 */
function hasValue<T>(t: T): Predicate<T> {
    return (t: T) => !isNullOrUndefined(t);
}

/**
 * Creates a predicate that matches tokens in `freeText` to extracted field 
 * values. The free text is split on the space character, producing a set of 
 * substrings to match on.
 * 
 * @param {FieldExtractor<T>} f a function that supplies an array of field 
 *                              values from an object.
 * @param {string} freeText the space-separated tokens to search for
 * @returns a predicate that returns true when all tokens are found within a 
 *          given value
 */
function freeTextPredicate<T>(f: FieldExtractor<T>, freeText: string): Predicate<T> {       
    return (t: T) => freeText.split(' ')
                             .map((s) => arrayContainsSubstring(f(t), s))
                             .reduce((a, b) => a && b);
}

/**
 * A predicate that returns true if any string in an array contains a 
 * given substring
 * 
 * @param {string[]} ss an array of values to evaluate
 * @param {string} substring the substring to search for in each value
 * @returns {boolean} true if one or more elements in the array contains the 
 *                         substring
 */
function arrayContainsSubstring<T>(ss: string[], substring: string): boolean {
    const lowercaseSubstring = substring.toLowerCase();
    return ss.filter(hasValue)
             .map((s) => s.toLowerCase())
             .filter((s) => s.includes(lowercaseSubstring))
             .length !== 0;
}
```

#### Application Code

With the API in place, making search work for any table involves defining how some object can be converted to a String array. For a person:

```typescript
const personFieldExtractor = (p: Person) => [
    p.firstName, 
    p.lastName, 
    p.age.toString(), 
    p.addresss, 
    p.country
];
```
On the `keyup` event in the search box, we create a predicate from the current search string and apply it to the list of table records.

```typescript
const bySearchPattern = freeTextPredicate(personFieldExtractor, searchPattern);
const peopleToDisplay = allThePeople.filter(bySearchPattern);
```

## Sort

#### Requirement

When a user clicks on a table column header, the table is sorted by the corresponding field. 

#### API

Here we create a data structure that maps each column label to a comparator, tracks the currently selected column, and modifies sort order according to whether the search is ascending or descending.

```typescript
class TableSort<T> {
    public ascending = true;
    public selectedColumn: string;
    public columnComparators = new Map<string, Comparator<T>>();

    public selectedColumnComparator() {
        const ordering = this.ascending ? 1 : -1;
        const columnComparator = this.columnComparators.get(this.selectedColumn);
        return (x: T, y: T) => columnComparator(x, y) * ordering;
    }
}

const stringComparator = (x: string, y: string) => {
    safeCompare(x, y, (x, y) => x.localeCompare(y));
}
const numberComparator = (x: number, y: number) => {
    safeCompare(x, y, (x, y) => x - y);
}

/**
 * Given an object of type T, returns the value of a field with type U
 */
type FieldAccessor<T, U> = (t: T) => U;

/**
 * Compares two objects of type T by applying Comparator c to the values 
 * supplied by the given {@link FieldAccessor}
 */
function fieldComparator<T, U>(f: FieldAccessor<T, U>, c: Comparator<U>) {
    return (x: T, y: T) => safeCompare(f(x), f(y), c);
}

```

#### Application Code

For the person table we declare some functions defining how each column value is accessed:

```typescript
const firstName = (p: Person) => p.firstName;
const lastName = (p: Person) => p.lastName;
const age = (p: Person) => p.age;
const address = (p: Person) => p.address;
const country = (p: Person) => p.country;
```
Type-inference keeps the verbiage down but each of those is recognized by the compiler as a 
`FieldAccessor<Person, string>` or `FieldAccessor<Person, number>` depending on the type of the field [^3]. Then we have:

```typescript
const firstNameComparator = fieldComparator(firstName, stringComparator);
const lastNameComparator = fieldComparator(lastName, stringComparator);
const ageComparator = fieldComparator(age, numberComparator);
const addressComparator = fieldComparator(address, stringComparator);
const countryComparator = fieldComparator(country, stringComparator);

const tableSort = new TableSort();
tableSort.columnComparators.set('firstName', firstNameComparator);
tableSort.columnComparators.set('lastName', lastNameComparator);
tableSort.columnComparators.set('age', ageComparator);
tableSort.columnComparators.set('address', addressComparator);
tableSort.columnComparators.set('country', countryComparator);
```

## A Good Start

The code is clean and it works. Small, appropriately-named functions clearly convey intent. A maintainer should have no problem understanding what is happening, and how.

But ours is a large application with over 50 of these tables. Many of them, while displaying different types, have similar columns. In this example we can imagine `country` and `address` belonging to several types, configured the same way. It would be nice to share the configuration code across tables. 

## Next

In [part 2][part2], we'll examine some strategies for code-reuse that get us further, and present a new challenge that Patrick and I react to in vastly different ways...

[^1]: Assuming the preferred strict configuration in `tsconfig.json`  

[^2]: It's not quite this simple: Some field values are localized for display, thus must be localized during search and sort. Searching on date values depends on the applied date format. While those cases are handled, they are beyond the focus of this article.  

[^3]: Incidentally Java 10 introduced type inference at the variable definition level which has a major impact on how the language feels and reads. Its adoption should be encouraged.  

[part2]: {% link _posts/2019-01-15-typescript-a-good-part-2.md %}
