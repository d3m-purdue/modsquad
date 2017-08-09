import argparse
import itertools
import math
import random
import string
import sys


def main():
    parser = argparse.ArgumentParser(description='Generate random data files')
    parser.add_argument('-c', '--cols', type=int, default=5)
    parser.add_argument('-r', '--rows', type=int, default=10)
    parser.add_argument('-s', '--seed', type=int, default=0)
    parser.add_argument('-e', '--exponential', type=str)
    parser.add_argument('col_names', metavar='COL_NAME', nargs='*')

    args = parser.parse_args(sys.argv[1:])

    # Compute column names - use the names given on the command line, and if
    # more are needed, use in-order "words" starting with "A", "B", ..., "Z",
    # "AA", "AB", etc.
    if len(args.col_names) < args.cols:
        def _all_strings():
            for i in itertools.count(1):
                yield map(lambda x: ''.join(x), itertools.combinations_with_replacement(string.ascii_uppercase, i))

        all_strings = itertools.chain.from_iterable(_all_strings())

        for _ in range(len(args.col_names), args.cols):
            args.col_names.append(all_strings.next())

    # Initialize random number generator.
    random.seed(args.seed)

    # Analyze exponential column headers.
    exp_list = []
    if args.exponential is not None:
        try:
            exp_list = map(int, args.exponential.split(','))
        except ValueError:
            print >>sys.stderr, 'argument to -e/--exponential must be comma separated integers'
            return 1

    exp = set(exp_list)

    # Generate data columns.
    datacols = []
    for i in range(args.cols):
        if i in exp:
            args.col_names[i] = 'exp_%s' % (args.col_names[i])
            datacols.append([-math.log(getPositiveSample()) / 0.01 for _ in range(args.rows)])
        else:
            datacols.append([random.gauss(0, 1) for _ in range(args.rows)])

    # Transpose to rows.
    datarows = zip(*datacols)

    # Print header line.
    print ','.join(args.col_names)

    # Emit the data.
    print '\n'.join(map(lambda row: ','.join(map(str, row)), datarows))

    return 0


def getPositiveSample():
    sample = -1
    while sample < 0:
        sample = random.gauss(1, 1)
    return sample


if __name__ == '__main__':
    sys.exit(main())
