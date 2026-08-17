Feature: Infinite grid
  As a player building large or far-flung patterns
  I want the grid to have no boundaries
  So that I can place and evolve cells at any coordinate, including negative ones

  Scenario: Cells can be placed far from the origin in any direction
    Given an empty grid
    When I toggle the cell at (-500, -500)
    And I toggle the cell at (1000000, -1000000)
    Then the cell at (-500, -500) should be alive
    And the cell at (1000000, -1000000) should be alive

  Scenario Outline: A pattern evolves identically no matter where it sits on the grid
    Given a horizontal blinker centered at (<x>, <y>)
    When the next generation is computed
    Then the blinker should be vertical

    Examples:
      | x       | y        |
      | 0       | 0        |
      | -500    | -500     |
      | 250000  | -250000  |
