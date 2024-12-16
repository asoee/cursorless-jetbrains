package org.example;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello IDEA welcome!");
        for (int i = 1; i <= 5; i++) {
            doSomethingElse(i);
        }
    }
    private static void doSomethingElse(int i) {
        System.out.println("i = " + i);
    }
}