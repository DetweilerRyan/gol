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

  # "expected center x/y" duplicate the numeric value of x/y on purpose: the
  # blinker's post-generation center happens to sit at the same coordinate it
  # started at, but these columns are independent literals pinned by hand,
  # not derived from <x>/<y> at test time -- so a mutated <x> or <y> still
  # shifts the actual live cells away from this fixed expectation.
  Scenario Outline: A pattern evolves identically no matter where it sits on the grid
    Given a horizontal blinker centered at (<x>, <y>)
    When the next generation is computed
    Then the blinker should be vertical
    And the blinker should be centered at the literal coordinate (<expected center x>, <expected center y>)

    Examples:
      | x      | y       | expected center x | expected center y |
      | 0      | 0       | 0                 | 0                 |
      | -500   | -500    | -500              | -500              |
      | 250000 | -250000 | 250000            | -250000           |
