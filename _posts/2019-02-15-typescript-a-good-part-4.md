---
layout: post
title:  "TypeScript: A Good Part - Part 4 of 4"
---
## Recap

In [part 1][part1] of this series we developed an API for searching and sorting HTML tables. We introduced some code reuse in [part 2][part2] but were dissatisfied with the boilerplate. [Part 3][part3] teased us with `keyof`, a promising feature of the type system. In this final post we dig in and finally deliver the goods.

## Mapped, Conditional Types

#### Mapped Types

TypeScript provides the ability to transform a type into another type using a mapping operation. Imagine we want to create a version of our `Person` type where all the fields are read-only:

```typescript
type ReadonlyPerson = { readonly [k in keyof Person]: Person[k] }
```

With that, you can tell the compiler to take an instance of the Person class

```typescript
class Person {
    firstName: string;
    lastName: string;
    age: number;
    address: string;
    country: string;
}
```

And treat it as though it was written this way:

```typescript
class ReadonlyPerson {
    readonly firstName: string;
    readonly lastName: string;
    readonly age: number;
    readonly address: string;
    readonly country: string;
}
```

Pretty cool trick if you decide to introduce immutability to an existing API, for example.

#### Conditional Types

Conditions can be applied to types during mapping. Here we create a type that contains only the string fields on Person:

```typescript
type PersonStrings = { 
    [k in keyof Person] : Person[k] extends string ? k : never 
}[keyof Person]
```
That says `map k -> k if Person[k] is a string, otherwise map k -> never`, which is a type that matches nothing

```typescript
type PersonStrings: 'firstName' | 'lastName' | never | 'address' | 'country'
```
Effectively eliminating `'age'` from the union. This is exactly what we need.

## The Final Version

#### API Modifications

First we add some type aliases that are easier to digest than the raw definitions 

```typescript
/**
 * Union of all keys K in type T, where the type of T[K] is in U
 */
type FieldOf<T, U> = { [K in keyof T]: T[K] extends U ? K : never }[keyof T];

/**
 * Union of all keys in type T, where the type of T[K] is a string
 */
type StringFieldOf<T> = FieldOf<T, string>;

/**
 * Union of all keys in type T, where the type of T[K] is a number
 */
type NumberFieldOf<T> = FieldOf<T, number>;
```

And fix the hole[^1] in the TableSort API. 

```typescript
class TableSort<T> {
    ...
    
    public addString(...keys: StringFieldOf<T>[]) {
        keys.forEach((key: K) => this.columnComparators.set(
            String(key), stringComparator(key)));
    }
    
    public addNumber(...keys: NumberFieldOf<T>[]) {
         keys.forEach((key: K) => this.columnComparators.set(
             String(key), numberComparator(key)));
    }
}
```

#### Application Code

The compiler now prevents us from doing the *wrong* thing and code completion guides us to the *right* thing. Adding the `string` columns

![Image of Code Completion Example][cc-string-field-names]

And the `number` column

![Image of Code Completion Example-2][cc-number-field-names]

Yields this table configuration code

```typescript
const tableSort = new TableSort<Person>();
tableSort.addString('firstName', 'lastName', 'address', 'country');
tableSort.addNumber('age');
```

And this code refreshes the display

```typescript
const bySelectedHeader = tableSort.selectedComparator();

const bySearchPattern = textPredicate(searchPattern, 
          'firstName', 'lastName', 'age', 'address', 'country');

const peopleToDisplay = allThePeople
          .filter(bySearchPattern)
          .sort(bySelectedHeader);
```

Beautiful! No boilerplate. It looks almost exactly like JavaScript, but has all the power of compiler-enforced type constraints behind it. We can build and refactor on this foundation with confidence, move faster, and break less things.

## TypeScript - A Good Part

Okay, TypeScript has *a lot* of *great* parts. Like JavaScript, the language is an expressive joy. Unlike JavaScript, it is not a waking nightmare when the project grows beyond 100 lines of code[^2]<sup>,</sup>[^3]. 

It should be noted that our team *has* struggled with quirks arising from JavaScript compatibility. While backward compatibility is a smart strategic step for language designers, if you're a developer starting a new project, *turn off the compatibility features*. In areas of our codebase where we are deep in pure TypeScript, it is a true pleasure. Around the edges where it's still JavaScripty, we still spin our wheels, scratch our heads, and roll the dice.

## How Excellence Happens

My teammate Patrick and I never set out to solve this problem together. We were independently driven to rid the code of some repetitive boilerplate. Along the way, we discussed some ideas and agreed that, while our respective ideas had merit, none were satisfying. We kept up our other work, but poked at this problem along the way. And we came up with something better than either of us could have done alone. We both discovered something new, and I had a $5 beer. For me, this kind of experience brings the most joy, and I am grateful to Patrick for having the enthusiasm and desire to challenge my work, to make our software better, together. 

---

[^1]: https://www.youtube.com/watch?v=UPBd8eHQqIw
[^2]: With a strict compiler configuration enabled.
[^3]: When *exactly* the nightmare begins is up for debate. But it *will* happen.

[cc-string-field-names]: /assets/string-field-names.png
[cc-number-field-names]: /assets/number-field-names.png

[part1]: {% link _posts/2018-12-15-typescript-a-good-part-1.md %}	
[part2]: {% link _posts/2019-01-15-typescript-a-good-part-2.md %}
[part3]: {% link _posts/2019-02-01-typescript-a-good-part-3.md %}
