---
layout: post
title:  "Optional - The Missing Manual - Part 1"
---
March 18, 2020 marks the 6th anniversary of Java 8. A highlight of the release was the introduction Functional Programming concepts, like Lazy `Streams` and an `Optional` data type. Java's roadmap sees the functional trend continuing, so much that in three years, the way java is written will be fundamentally different. And better.

Unfortunately, my experience over the past several years has indicated that few developers - spanning from novice to expert - are learning how to use these new features. In particular, `Optional` is not just a null-safe data object. It is Java opening the door to a fundamentally different way of computing. It is the first step in a long journey that the Java design team has embarked on, in its commitment to remain relevant.

In this article I hope to demonstrate how to properly use the `Optional` type, and hopefully spark interest in this different way of thinking.

## More than Not Null
Consider this typical style of code

```java
public String getFullName(PopStar popStar) {
    String firstName = popStar.getFirstName();
    if (firstName != null) {
        String lastName = popStar.getLastName();
        if (lastName != null) {
            return firstName + " " + lastName;
        } else {
            return firstName;
        }
    } else {
        return "The Artist Formerly Known as Prince";
    }
}
```

The problem with this code is that the user of the `PopStar` API must know that both `getFirstName` and `getLastName` may return `null`, but there is nothing in the method signature that indicates so; it is a hidden specification that makes the calling program susceptible to null pointer exceptions.

It is better to have `getFirstName` and `getLastName` return an `Optional<String>`. This way, the return type in the method signature explicitly informs the user that the value may be absent when the call is made.

The client code can then be rewritten as

```java
public String getFullName(PopStar popStar) {
    Optional<String> firstName = popStar.getFirstName();
    if (firstName.isPresent()) {
        Optional<String> lastName = popStar.getLastName();
        if (lastName.isPresent()) {
            return firstName.get() + " " + lastName.get();
        } else {
            return firstName.get();
        }
    } else {
        return "The Artist Formerly Known as Prince";
    }
}
```

Here the user was informed by the API that the value may be absent and knows to handle that situation. However, the code is still contaminated with the more verbose `Optional<String>` declaration, along with calls to `isPresent` and `get` . The intent of `getFullName` is to construct the full name of the pop star. The extra syntax adds noise. From the caller perspective, the `Optional` type, while informative, is no better than handling `null`, or perhaps even worse because of the additional noise. Why bother with this thing?

## Prefer Map over IsPresent and Get

The creators of `Optional` feel our pain. `Optional` contains a `map` method which allows a function to be applied to the value inside *if it exists*. It frees the user from checking for the value, allowing focus to remain on what needs to be done with the value when it is there. The so-called *happy path*.

The code can be rewritten this way now

```java
public String getFullName(PopStar popStar) {
    return popStar.getFirstName()
            .map(firstName -> popStar.getLastName()
                    .map(lastName -> firstName + " " + lastName)
                    .orElse(firstName)
            )
            .orElse("The Artist Formerly Known as Prince");
}
```

Well that *is* a lot shorter but it is **terrible**! This is a simple function but it looks pretty confusing for a reader. Our goal is to remove complexity, not obfuscate further! 

## Map Is Not Enough
Just using `map` with a lambda can create serious noise and confusion, even with the simple example shown above. Replacing the lambda with a well-named helper function goes a long way to clarifying the intent.

Here is the code with the second lambda refactored into a named function 

```java
public String getFullName(PopStar popStar) {
    return popStar.getFirstName()
            .map(firstName -> joinWithLastNameOf(popStar, firstName))
            .orElse("The Artist Formerly Known as Prince");
}

private String joinWithLastNameOf(PopStar popStar, String firstName) {
    return popStar.getLastName()
            .map(lastName -> firstName + " " + lastName)
            .orElse(firstName);
}
```

Kind of better, but not really. The main advantage is we have divided `getFullName` into two functions

1. The top level entry point which aims to describe *what* is happening. It's not quite there though...
2. A helper function, describing *how* the computation is done

## Strive for Concision and Clarity

```java
public String getFullName(PopStar popStar) {
    return popStar.getFirstName()
            .map(joinWithLastNameOf(popStar))
            .orElse("The Artist Formerly Known as Prince");
}

private Function<String, String> joinWithLastNameOf(PopStar popStar) {
    return firstName -> popStar.getLastName()
            .map(lastName -> firstName + " " + lastName)
            .orElse(firstName);
}
```

Here the top level function is very readable, to the point where we can skip reading the helper function because we already understand the intent. The only time we would need to read the helper function is to troubleshoot an error. Oftentimes, however, these helper functions are so simple, errors are unlikely.

## Partial Function Application
Notice that the new version of `joinWithLastNameOf` accepts a `PopStar`, then returns another function. The returned function will receive its `firstName` parameter *implicitly* when `map`  is called. You can think of `joinWithLastNameOf` as a function that takes two parameters, but at different times. This is called *Partial Application*. First, it is primed with the value of a `PopStar` and then at some future point, it will receive the value of `firstName`, at which time it will perform its computation. In Functional Programming, Partial Application is analogous to Dependency Injection, but with a lot less syntactic ceremony.

## Stay Tuned
There is a lot more to talk about with Optionals... in a future post. For now, the takeaway is: Avoid using `isPresent` and `get` . Once you have an `Optional` in your hands, work inside it by passing in functions and letting the `Optional` type handle the `null` checking for you. And if you feel lambdas are making the code confusing, refactor them into named functions. Think about the structure of those functions and try to leverage the implicit parameter passing that happens when `map` is used. 

Happy clean coding!

