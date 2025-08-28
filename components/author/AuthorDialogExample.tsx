// Example usage of AuthorDialog component

import { AuthorDialog } from './AuthorDialog';
import { Button } from "@/components/ui/button";

export function AuthorDialogExample() {
  return (
    <div className="space-y-4">
      <h2>Author Dialog Examples</h2>
      
      {/* Example 1: Button trigger */}
      <AuthorDialog authorName="Andrew Y. Ng">
        <Button variant="outline">
          View Andrew Y. Ng Profile
        </Button>
      </AuthorDialog>

      {/* Example 2: Author name as clickable text */}
      <AuthorDialog authorName="Geoffrey Hinton">
        <span className="text-blue-600 hover:underline cursor-pointer">
          Geoffrey Hinton
        </span>
      </AuthorDialog>

      {/* Example 3: In a paper author list */}
      <div className="border p-4 rounded">
        <h3 className="font-semibold mb-2">Paper Title Example</h3>
        <p className="text-sm text-muted-foreground">
          Authors: 
          <AuthorDialog authorName="Yann LeCun">
            <span className="text-blue-600 hover:underline cursor-pointer ml-1">
              Yann LeCun
            </span>
          </AuthorDialog>
          , 
          <AuthorDialog authorName="Yoshua Bengio">
            <span className="text-blue-600 hover:underline cursor-pointer ml-1">
              Yoshua Bengio
            </span>
          </AuthorDialog>
        </p>
      </div>
    </div>
  );
}
