---
layout: post
title:  "TypeScript: A Good Part - Part 2 of 4"
---
## Recap

Recall in [part 1][part1] we developed an API for searching and sorting HTML tables. While satisfied with our work, opportunities for code reuse had presented themselves. 

## Interfaces

One way to share some code might be to define an interface shared across types. 

```typescript
interface HasAddress {
    address: string;
}

class Person implements HasAddress {
    firstName: string;
    address: string;
	...
}

class Company implements HasAddress {
    name: string;
    address: string;
    ...
}
```

Then we can use this comparator for many types, provided they have an `address` field.

```typescript
const address = (h: HasAddress) => h.address;
const addressComparator = fieldComparator(address, stringComparator);
```

But refactoring the existing domain model to implement a bunch of interfaces is a broad, sweeping change, preferably avoided. TypeScript has another option.

## Structural Types, aka Duck Types
Similar, but with a more ad-hoc feel than a formal interface, a type can be described solely by its structure.

```typescript
{ address: string };
```

Now we can create the same comparators without having to modify existing type definitions. Here, the compiler will accept any type that has an address field.

```typescript
const address = (h: { address: string }) => h.address;
const addressComparator = fieldComparator(address, stringComparator);
```
But used more than sparingly, structural types loose their luster. Code becomes harder to read. It's better to name your types[^1].

```typescript
type HasAddress = { address: string };
```

Now it looks just like an interface. The compiler will accept any type that has an address field as a `HasAddress` type.

```typescript
const address = (h: HasAddress) => h.address;
const addressComparator = fieldComparator(address, stringComparator);
```

And actually, it turns out the compiler can infer that a type implements an interface without an explicit declaration. So structural types and interfaces are nearly the same[^2].

The result is solid code, reusable across many types, and easy to incorporate into the existing codebase. Intent is clear and static typing informs the compiler how to catch three kinds of errors: 

1. Does the field exist on the target type?
2. Is the field a string? 
3. Does the comparator operate on strings?

Thus freeing us from writing tests for those scenarios.

## Same Type, Different Name

The situation has been improved with some code-reuse, but there are instances where fields have the same semantic type, with different names.

```typescript
class Company {
    streetAddress: string;
    mailingAddress: string;
}
```

Each one requires a new field accessor and comparator:

```typescript
type hasStreetAddress = { streetAddress: string };
const streetAddress = (h: hasStreetAddress) => h.streetAddress;
const streetAddressComparator = fieldComparator(streetAddress, stringComparator); 

type hasMailingAddress = { mailingAddress: string };
const mailingAddress = (h: hasMailingAddress) => h.mailingAddress;
const mailingAddressComparator = fieldComparator(mailingAddress, stringComparator); 
```

Still solid, but there are *a lot* of these and it feels like we are pushing against a verbosity threshold. We want our display logic to convey *what* is being done, not be cluttered with details of *how*. Ideally, these boilerplate API definitions would be kept outside of UI components. One option could be to hide the boilerplate in a `comparators.ts`  file, but that introduces a maintenance issue I would prefer to avoid[^3]. 

The best code is no code. Is there nothing else we can do?

## Patrick and The JavaScript Way

Up to this point, I have been writing Scala using TypeScript syntax, and now I am stuck. My teammate Patrick proposed an alternative, obvious to anyone with his JavaScript background.

```typescript
function stringComparator<T>(fieldName: string) {
    if (new T().hasOwnProperty(fieldName)) {
        return (x: T, y: T) => safeStringComparator(x[fieldName], y[fieldName]);
    } else {
        throw new Error(`Type ${T} does not have field ${fieldName}`);
    }
}
```

With that, we could write this API:

```typescript
class TableSort<T> {
    ...
        
    public addString(...fieldNames: string[]) {
        fieldNames.forEach((fieldName: string) => {
            this.columnComparators.set(fieldName, stringComparator(fieldName)));
        }
    }
    
    public addNumber(...fieldNames: string[]) {
         fieldNames.forEach((fieldName: string) => {
             this.columnComparators.set(fieldName, numberComparator(fieldName)));
         };
    }
}
```

Which would enable this client code:

```typescript
const tableSort = new TableSort();
tableSort.addString('firstName', 'lastName', 'address', 'country');
tableSort.addNumber('age');
```

That is pure loveliness. 

But it violates type safety. Those field names are all strings! It's a disaster waiting to happen. The goal is to make the compiler work for us[^4]; to avoid runtime errors. 

But the appeal is undeniable. Clean, concise, and correct, unless the developer makes a typo and spells the field name incorrectly, in which case it is broken. It's the easiest error to make and not worth the benefit.

## Two Gladiators Rage in Conflict

Patrick and I went away scratching our heads. Patrick thought some more and did some research. I had a beer because it was $5 Pale Ale day at the nearby brew pub. I couldn't come up with anything better than the "hidden boilerplate" version. Patrick preferred his version. Both had merit. Both were unsatisfactory. We considered each other's position and thought, "Hmm."

## Coming up

In [part 3][part3], Patrick breaks the stalemate with a wonderful discovery...

---
[^1]: Type aliasing is real a treat for proponents of self-documenting code.

[^2]: The language documentation mentions some subtle differences but they are not important to this discussion. 
[^3]: It's sociological. It means every developer now must be concerned with API extension and maintenance, on top of regular application maintenance.  A set of rules needs to be dissipated to the team about how to do so consistently. And every team member must agree with the rules. And care about the rules. And remember the rules. Because there's no automatic way to enforce the rules. It will never work!
[^4]: We could write some unit tests, but the goal in this scenario is to write *less* code. We have already shown a bit more code can make the compiler do the error checking. Replacing that with unit tests is merely doing the same thing differently, and arguably, less effectively. 

[part1]: {% link _posts/2018-12-15-typescript-a-good-part-1.md %}
[part3]: {% link _posts/2019-02-01-typescript-a-good-part-3.md %}


