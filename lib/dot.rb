class Dot
  attr_accessor :raw
  def initialize path
    @raw = File.read(path)
  end
  def nodes
    @raw.lines
        .map { |x| x.match /([^ \]]+) *\[label=/}
        .compact
        .map { |x| x[1] }
  end
  def connections
    @raw.lines
        .map { |x| x.match /(\w+) *-- *(\w+) *\[color=(\w+)\]/ }
        .compact
        .map { |x| x[1..3] }
  end
  def legend
    @raw.match(/Legend.*label=<(.*)>\]/m)[1]
  end
end
