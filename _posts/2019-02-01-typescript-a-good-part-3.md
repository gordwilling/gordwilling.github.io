---
layout: post
title:  "TypeScript: A Good Part - Part 3 of 4"
---
## Recap

In [part 1][part1] of this series we developed an API for searching and sorting HTML tables. We introduced some code reuse in [part 2][part2] but ended up with a lot of boilerplate and fell short in our efforts to address the problem. In this post we discover a feature of TypeScript that offers hope.

## Discovery

Some days later Patrick says:

"Hey, Gordon, I found something. Check this out."

```typescript
function stringComparator<T, K extends keyof T>(key: K): Comparator<T> {
    return (x: T, y: T) => safeStringComparator(
        String(x[key]), String(y[key]));
}
```

What's this? What does `K extends keyof T` mean[^1]? 

As in JavaScript, TypeScript allows objects to be treated as an associative array where a field value can be accessed like this:

```typescript
const firstName = person['firstName'];
```

But in TypeScript, while `firstName` is a string, it is also a type. Because `Person` has a field called `firstName`, the string `firstName` matches a type called `keyof Person`. If you inspect `keyof Person` you see a union type consisting of all field names in `Person`.

```text
type keyof Person: 'firstName' | 'lastName' | 'age' | 'address' | 'country' 
```

Now we can write code that feels just like Patrick's [gorgeous JavaScript][PatricksJavaScript], but the compiler will actually detect spelling errors:

```typescript
const firstName = person['fistName'];
```
Yields a compile error:

```text
TS2345: Argument of type 'fistName' is not assignable to parameter of type: 

 'firstName' | 'lastName' | 'age' | 'address' | 'country'
```

How great is that? Sold! Now we can update the TableSort API

```typescript
class TableSort<T> {
    ...
    
    public addString<K extends keyof T>(...keys: K[]) {
        keys.forEach((key: K) => this.columnComparators.set(
            String(key), stringComparator(key)));
    }
    
    public addNumber<K extends keyof T>(...keys: K[]) {
         keys.forEach((key: K) => this.columnComparators.set(
             String(key), numberComparator(key)));
    }
}
```

Recalling the [search API][searchAPI], while we're at it we can lose the `FieldExtractor` and write a new predicate leveraging the`keyof T` type

```typescript
function textPredicate<T>(freeText: string, ...keys: (keyof T)[]): Predicate<T> {
    return (t: T) => {
        const fieldStringValues = keys.map((k) => String(t[k]));
        return freeText.split(' ')
            .map((s) => arrayContainsSubstring(fieldStringValues, s))
            .reduce((a, b) => a && b);
    };
}
```

Then users can write code like this to set up the table

```typescript
const tableSort = new TableSort<Person>();
tableSort.addString('firstName', 'lastName', 'address', 'country');
tableSort.addNumber('age');
```
And an IDE can offer code completion

![Image of Code Completion Example][cc-text-predicate-all-field-names]

![Image of Code Completion Example][cc-all-field-names]

Whoops. Code completion just ruined our day.

## Holey API!

The astute reader will recognize that `age` is a `number` field, yet code completion offers it as an option where a `string` field is expected. We want this for the `textPredicate;` all fields values will be converted to strings for the text search. But `tableSort.addString()` should clearly reject the addition of `age` to its list. 

To illustrate the problem, consider how these types resolve

```text
keyof Person: 'firstName' | 'lastName' | 'age' | 'address' | 'country'

Person['firstName']: string

Person['age']: number

Person[keyof Person]: string | number
```

And this code

```typescript
function addString<T, K extends keyof T>(...keys: K[]) {
    keys.forEach((key: K) => this.columnComparators.set(
        String(key), stringComparator(key)));
}
```

This definition permits calling `addString('age')` but it *should* be an error because `Person['age']` is a number. We need to distinguish between string fields and number fields with something like 

```typescript
keyof Person where Person[keyof Person] extends string: 

  'firstName' | 'lastName' | 'address' | 'country'

keyof Person where Person[keyof Person] extends number: 'age'
```

Two types for which we can write two type-safe functions. One could imagine these additions to the `TableSort<T>` API:

```typescript
class TableSort<T> {
    ...
    
    function addString<T, K extends keyof T where T[K] extends string>(...keys: K[]) {
        keys.forEach((key: K) => this.columnComparators.set(
            key, stringComparator(key)));

    function addNumber<T, K extends keyof T where T[K] extends number>(...keys: K[]) {
        keys.forEach((key: K) => this.columnComparators.set(
            key, numberComparator(key)));
    }    
}

```

Surely that's too much to ask of the type system. On the other hand, the utility of `keyof` seems starkly limited if these additional constraints can't be applied. What does TypeScript have to say about all this? Find out in the [final post][part4] of this series.

---
[^1]: ```keyof``` is *not* the capital of Ukraine.

[cc-text-predicate-all-field-names]: assets/text-predicate-all-field-names.png

[cc-all-field-names]: /assets/all-field-names.png

[part1]: {% link _posts/2018-12-15-typescript-a-good-part-1.md %}	
[part2]: {% link _posts/2019-01-15-typescript-a-good-part-2.md %}
[part4]: {% link _posts/2019-02-15-typescript-a-good-part-4.md %}

[PatricksJavaScript]: {% link _posts/2019-01-15-typescript-a-good-part-2.md %}#patrick-and-the-javascript-way "Patrick's Gorgeous Javascript"

[SearchAPI]: {% link _posts/2018-12-15-typescript-a-good-part-1.md %}#free-text-search "search API"
