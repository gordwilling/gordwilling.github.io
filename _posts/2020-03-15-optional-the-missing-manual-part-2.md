---
layout: post
title:  "Optional - The Missing Manual - Part 2"
---
In [part 1][part1] we learned that `map` enables us to work within the *context* of an `Optional` value, handling `null` values implicitly as information moves through a pipeline. We learned that passing *named* functions to `map` improves readability, and how thoughtful use of *Partial Function Application* enhances it even further.

## Map Is Still Not Enough

Once sold on the idea of `Optional` and a developer starts to sprinkle it about the codebase, strange inconveniences arise. 

Consider this API

```java
public class Person {
    // ...
    public Optional<Person> getSpouse();
    public Optional<Car> getCar();
}
```
And imagine we want to find what kind of car belongs to someone's spouse.

```java
Optional<Car> car = person.getSpouse().map(Person::getCar)     
```

> Sidenote: `Person::getCar` is Java's **method reference** syntax. Here `map` calls `getCar` on the spouse, *if it exists*.

This definitely does not compile. 

Because `getCar` and `getSpouse` both return an `Optional`, the types become nested, resulting in an `Optional<Optional<Car>>`.

## Map And Flatten

The authors of Optional were aware of this circumstance and kindly provided a method that works the same way as `map` does, except flattens the nested structure back into a single `Optional`. This method is aptly named `flatMap`.
```java
Optional<Car> car = person.getSpouse().flatMap(Person::getCar)     
```
This works the way we want, and you'll know when to use it when the compiler complains!

## Do We Like It?

Let's pause for a second to remember how this would be without the `Optional` type:

```java
Car car = null;
Person spouse = person.getSpouse();
if (spouse != null) {
    car = spouse.getCar();
}
```
Ew. Beyond null-safety, this is the reason to use Optional. It makes things more readable.

## But Then Collections...

While `map` and `flatMap` do their jobs well, issues arise when using `Optional` in the context of collections.

Imagine an event where the organizers need to know if parking should be provided. We might write something like

```java
List<Car> cars = attendees.stream()
        .map(Person::getCar)
        .collect(Collectors.toList());
```

This does not compile either because the return type is actually `List<Optional<Car>>`. 

We can bend to the wishes of the compiler, but considering the question, *"Does parking need to be provided?"*, a better model would be `Optional<List<Car>>`[^1]. This precisely addresses the two queries

1. *Are there any cars that need parking?*
1. *If so how many?*

Did the authors of `Optional` take care of this conversion for us as they did with `flatMap`. The answer, to my knowledge, is no. 

## Next Time

In the next post, we will supplement the `Optional` API with a few functions to address this and similar inconveniences.

---

[^1]: Another issue here is that the `List` and `Optional` types both model the concept of `empty`. An alternative representation would be to drop the `Optional` altogether and provide a `List<Car>`, the size of which can answer all of the pertinent questions. Depending on the circumstances, that may be better, but we will set that idea aside for this discussion.

[part1]: {% link _posts/2020-03-09-optional-the-missing-manual-part-1.md %}
