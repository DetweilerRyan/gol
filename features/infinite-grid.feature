Feature: Infinite grid
  As a player building large or far-flung patterns
  I want the grid to have no boundaries
  So that I can place and evolve cells at any coordinate, including negative ones

  Scenario: Cells can be placed far from the origin in any direction
    Given an empty grid
    When I toggle the cells at (-500, -500) and (1000000, -1000000)
    Then the cell at (-500, -500) should be alive
    And the cell at (1000000, -1000000) should be alive

  Scenario: A pattern far from the origin evolves exactly as one at the origin
    Given a horizontal blinker centered at (0, 0)
    And a horizontal blinker centered at (250000, -250000)
    When the next generation is computed
    Then the blinker at (0, 0) should be vertical
    And the blinker at (250000, -250000) should be vertical
