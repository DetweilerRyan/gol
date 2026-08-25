Feature: Infinite grid
  As a player building large or far-flung patterns
  I want the grid to have no boundaries
  So that I can place and evolve cells at any coordinate, including negative ones

  Scenario: Cells can be placed far from the origin in any direction
    Given an empty grid
    When I toggle the cells at (-20, -15) and (100, 0)
    Then the cell at (-20, -15) should be alive
    And the cell at (100, 0) should be alive

  Scenario: A pattern far from the origin evolves exactly as one at the origin
    Given a horizontal blinker centered at (0, 0)
    And a horizontal blinker centered at (100, -100)
    When the next generation is computed
    Then the blinker at (0, 0) should be vertical
    And the blinker at (100, -100) should be vertical
