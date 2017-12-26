require 'json'

class Specification
  def initialize dot
    @dot = dot
  end
  def to_json
    { nodes: @dot.nodes,
      connections: @dot.connections
    }.to_json
  end
end
