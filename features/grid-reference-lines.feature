Feature: Grid reference lines and coordinates
  As a player navigating a large or zoomed-out pattern
  I want major gridlines every 10 cells and coordinate labels along them
  So that I can tell where I am on the infinite grid at a glance

  Scenario Outline: A coordinate is a major gridline exactly every 10 cells
    Given a coordinate of <coordinate>
    Then it should <be_or_not> a major gridline

    Examples:
      | coordinate | be_or_not |
      | 0          | be        |
      | 10         | be        |
      | -10        | be        |
      | 100        | be        |
      | -100       | be        |
      | 5          | not be    |
      | 11         | not be    |
      | -3         | not be    |

  Scenario Outline: The major gridlines within a viewport are the multiples of 10 in range
    Given a visible range from x <minX> to <maxX> and y <minY> to <maxY>
    When the major gridlines are computed
    Then the major x gridlines should be <x gridlines>
    And the major y gridlines should be <y gridlines>

    Examples:
      | minX | maxX | minY | maxY | x gridlines      | y gridlines |
      | -23  | 17   | -5   | 26   | -20, -10, 0, 10  | 0, 10, 20   |
      | 1    | 9    | 1    | 9    |                  |             |
      | -10  | 10   | -10  | 10   | -10, 0, 10       | -10, 0, 10  |
      | -2   | 12   | -2   | 7    | 0, 10            | 0           |
