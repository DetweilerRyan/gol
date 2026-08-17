Feature: Cell life and death
  As a player of Conway's Game of Life
  I want cells to be born, survive, or die according to the standard rules
  So that patterns evolve the way the game defines

  Scenario: Toggling a dead cell brings it to life
    Given an empty grid
    When I toggle the cell at (2, 3)
    Then the cell at (2, 3) should be alive

  Scenario: Toggling a live cell kills it
    Given a live cell at (2, 3)
    When I toggle the cell at (2, 3)
    Then the cell at (2, 3) should be dead

  Scenario Outline: A cell's fate depends on its live neighbor count
    Given a cell that is <state>
    And it has <neighbors> live neighbors
    When the next generation is computed
    Then the cell should end up <next state>

    Examples:
      | state | neighbors | next state |
      | alive | 0         | dead       |
      | alive | 1         | dead       |
      | alive | 2         | alive      |
      | alive | 3         | alive      |
      | alive | 4         | dead       |
      | dead  | 2         | dead       |
      | dead  | 3         | alive      |
      | dead  | 4         | dead       |

  Scenario: A horizontal blinker becomes vertical after one generation
    Given a horizontal blinker centered at (1, 1)
    When the next generation is computed
    Then the blinker should be vertical

  Scenario: A vertical blinker becomes horizontal after one generation
    Given a vertical blinker centered at (1, 1)
    When the next generation is computed
    Then the blinker should be horizontal

  Scenario: A 2x2 block never changes
    Given a 2x2 block of live cells with its top-left corner at (0, 0)
    When the next generation is computed
    Then the block should be unchanged
